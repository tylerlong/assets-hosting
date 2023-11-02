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

  public async deleteContent(content: Content) {
    if (content.type === 'file') {
      await github.delete(`/repos/${this.repo?.full_name}/contents/${content.path}`, {
        data: {
          message: `Delete ${content.name}`,
          sha: content.sha,
        },
      });
      this.refresh();
    } else {
      // delete all the files in the dir
    }
  }
}

const store = manage(new Store());

export default store;
