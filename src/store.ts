import { manage } from 'manate';

export interface Token {
  access_token: string;
  refresh_token: string;
}

export class Store {
  public token: Token | undefined = undefined;
}

const store = manage(new Store());

export default store;
