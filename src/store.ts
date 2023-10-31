import { manage } from 'manate';
import axios from 'axios';

export interface Token {
  access_token: string;
}

export interface User {
  login: string;
}

export interface Repo {
  full_name: string;
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

  public async init() {
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
  }

  public async chooseContent(content: Content) {
    if (content.type === 'dir') {
      const r = await axios.get(`https://api.github.com/repos/${this.repo.full_name}/contents/${content.path}`);
      this.path = content.path;
      this.contents = r.data.filter((content: Content) => content.name !== '.gitkeep');
    }
  }
}

const store = manage(new Store());

export default store;
