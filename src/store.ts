import { manage } from 'manate';
import axios from 'axios';
import { message } from 'antd';
import path from 'path';

const github = axios.create({
  baseURL: 'https://api.github.com',
});

import CONSTS from './constants';

export interface Token {
  access_token: string;
}

export interface User {
  login: string;
}

export interface Repo {
  name: string;
  full_name: string;
  owner: User;
}

export interface Content {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
}

export class Store {
  public token: Token | undefined = undefined;

  public repos: Repo[] = [];

  public repo: Repo | undefined = undefined;

  public contents: Content[] = [];

  public path = '';

  public user: User | undefined = undefined;

  public host = '';

  public async init() {
    // get host, like https://chuntaoliu.com/
    github.defaults.headers.common.Authorization = `token ${this.token?.access_token}`;
    this.user = (await github.get('/user')).data;
    this.host = `https://${this.user.login}.github.io/`;
    global.ipc.on(CONSTS.HOST, (event: any, host: string) => {
      this.host = host;
    });
    global.ipc.invoke(CONSTS.HOST, this.user.login);

    // get all the repos
    let hasNextPage = true;
    let page = 1;
    while (hasNextPage) {
      const r = await github.get('/user/repos', {
        params: {
          visibility: 'public',
          per_page: 100,
          page,
          affiliation: 'owner,collaborator',
          sort: 'updated',
        },
      });
      for (const repo of r.data) {
        if (repo.has_pages === true) {
          this.repos.push(repo);
        }
      }
      hasNextPage = r.data.length === 100;
      page += 1;
    }
  }

  public async chooseRepo(repo: Repo) {
    this.repo = repo;
    const r = await github.get(`/repos/${repo.full_name}/contents`);
    this.contents = r.data.filter((content: Content) => content.name !== '.gitkeep');

    // get host for the current repo
    global.ipc.invoke(CONSTS.HOST, repo.owner.login);
  }

  public async chooseContent(content: { type: 'file' | 'dir'; path: string }) {
    if (content.type === 'dir') {
      const r = await github.get(`/repos/${this.repo.full_name}/contents/${content.path}`);
      this.path = content.path;
      this.contents = r.data.filter((content: Content) => content.name !== '.gitkeep');
    } else {
      navigator.clipboard.writeText(`${this.host}${this.repo.name}/${content.path}`);
      message.success('Copied to clipboard');
    }
  }

  public async upload(name: string, base64: string) {
    await github.put(`/repos/${this.repo?.full_name}/contents/${path.join(this.path, name)}`, {
      message: `Upload ${name}`,
      content: base64,
    });
    this.refresh();
  }

  public async refresh() {
    this.chooseContent({ type: 'dir', path: this.path });
  }

  public async delete(content: Content) {
    if (content.type === 'file') {
      await github.delete(`/repos/${this.repo?.full_name}/contents/${content.path}`, {
        data: {
          message: `Delete ${content.name}`,
          sha: content.sha,
        },
      });
      this.refresh();
    } else {
      let r = await github.get(`/repos/${this.repo?.full_name}/branches/main`);
      const sha = r.data.commit.sha; // get latest commit sha, it's also the latest tree sha
      r = await github.get(`/repos/${this.repo?.full_name}/git/trees/${sha}`, { params: { recursive: 1 } });
      const tree = [];
      const blobs = r.data.tree.filter((item) => item.type === 'blob' && item.path.startsWith(content.path + '/'));
      for (const blob of blobs) {
        tree.push({
          // delete old
          path: blob.path,
          mode: '100644',
          type: 'blob',
          sha: null,
        });
      }
      r = await github.post(`/repos/${this.repo?.full_name}/git/trees`, {
        base_tree: sha,
        tree,
      }); // create new tree
      r = await github.post(`/repos/${this.repo?.full_name}/git/commits`, {
        message: `Delete ${content.path}/`,
        tree: r.data.sha,
        parents: [sha],
      }); // create new commit
      r = await github.patch(`/repos/${this.repo?.full_name}/git/refs/heads/main`, {
        sha: r.data.sha,
      }); // update branch to point to new commit
      await this.refresh();
    }
  }

  public async mkdir(folderName: string) {
    if (folderName === '') {
      return;
    }
    await github.put(`/repos/${this.repo?.full_name}/contents/${path.join(this.path, folderName, '.gitkeep')}`, {
      message: `Create ${folderName}/`,
      content: '',
    });
    this.refresh();
  }

  public async rename(content: Content, newPath: string) {
    if (newPath === content.path) {
      return;
    }
    let r = await github.get(`/repos/${this.repo?.full_name}/branches/main`);
    const sha = r.data.commit.sha; // get latest commit sha, it's also the latest tree sha
    let message = `Rename ${content.path} to ${newPath}`;
    // rename file
    if (content.type === 'file') {
      r = await github.post(`/repos/${this.repo?.full_name}/git/trees`, {
        base_tree: sha,
        tree: [
          {
            // create new
            path: newPath,
            mode: '100644',
            type: 'blob',
            sha: content.sha,
          },
          {
            // delete old
            path: content.path,
            mode: '100644',
            type: 'blob',
            sha: null,
          },
        ],
      }); // create new tree
    } else {
      // rename folder
      message = `Rename ${content.path}/ to ${newPath}/`;
      r = await github.get(`/repos/${this.repo?.full_name}/git/trees/${sha}`, { params: { recursive: 1 } });
      const tree = [];
      const blobs = r.data.tree.filter((item) => item.type === 'blob' && item.path.startsWith(content.path + '/'));
      for (const blob of blobs) {
        tree.push({
          // create new
          path: path.join(newPath + blob.path.substr(content.path.length)),
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        });
        tree.push({
          // delete old
          path: blob.path,
          mode: '100644',
          type: 'blob',
          sha: null,
        });
      }
      r = await github.post(`/repos/${this.repo?.full_name}/git/trees`, {
        base_tree: sha,
        tree,
      }); // create new tree
    }
    r = await github.post(`/repos/${this.repo?.full_name}/git/commits`, {
      message,
      tree: r.data.sha,
      parents: [sha],
    }); // create new commit
    r = await github.patch(`/repos/${this.repo?.full_name}/git/refs/heads/main`, {
      sha: r.data.sha,
    }); // update branch to point to new commit
    await this.refresh();
  }
}

const store = manage(new Store());

export default store;
