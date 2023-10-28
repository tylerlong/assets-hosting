import { manage } from 'manate';
import axios from 'axios';

export interface Token {
  access_token: string;
  refresh_token: string;
}

export class Store {
  public token: Token | undefined = undefined;

  public user = undefined;

  public async fetchRepos() {
    const r = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${this.token?.access_token}`,
      },
    });
    console.log(JSON.stringify(r.data, null, 2));
  }
}

const store = manage(new Store());

export default store;
