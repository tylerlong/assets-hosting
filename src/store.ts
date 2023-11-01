import { manage } from 'manate';
import axios from 'axios';
import { message } from 'antd';
import path from 'path';

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
    this.user = (
      await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `token ${this.token?.access_token}`,
        },
      })
    ).data;
    this.host = `https://${this.user.login}.github.io/`;
    global.ipc.on(CONSTS.HOST, (event: any, host: string) => {
      this.host = host;
    });
    global.ipc.invoke(CONSTS.HOST, this.user.login);

    // get all the repos
    let hasNextPage = true;
    let page = 1;
    while (hasNextPage) {
      const r = await axios.get('https://api.github.com/user/repos', {
        headers: {
          Authorization: `token ${this.token?.access_token}`,
        },
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
    const r = await axios.get(`https://api.github.com/repos/${repo.full_name}/contents`);
    this.contents = r.data.filter((content: Content) => content.name !== '.gitkeep');

    // get host for the current repo
    global.ipc.invoke(CONSTS.HOST, repo.owner.login);
  }

  public async chooseContent(content: Content) {
    if (content.type === 'dir') {
      const r = await axios.get(`https://api.github.com/repos/${this.repo.full_name}/contents/${content.path}`);
      this.path = content.path;
      this.contents = r.data.filter((content: Content) => content.name !== '.gitkeep');
    } else {
      navigator.clipboard.writeText(`${this.host}${this.repo.name}/${content.path}`);
      message.success('Copied to clipboard');
    }
  }

  public async upload(name: string, base64: string) {
    await axios.put(
      `https://api.github.com/repos/${this.repo?.full_name}/contents/${path.join(this.path, name)}`,
      {
        message: 'upload',
        content: base64,
      },
      {
        headers: {
          Authorization: `token ${this.token?.access_token}`,
        },
      },
    );
    this.chooseContent({ type: 'dir', path: this.path, name: '' });
  }
}

const store = manage(new Store());

export default store;
