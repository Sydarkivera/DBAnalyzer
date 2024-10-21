import {
  observable, action, computed,
} from 'mobx';
import { v4 as uuid } from 'uuid';
import DatabaseManager from '../database';
import { ConnectionData } from '../database/structures';
import DatabaseStructureStore from './DatabaseStructure';
import ErrorStore from './ErrorStore';

const FileStore = window.require('electron-store');
const fileStore = new FileStore();

export default class ConnectionStore {
  @observable username = '';

  @observable password = '';

  @observable server = '';

  @observable database = '';

  @observable port = 0;

  @observable dbms = 'mysql';

  @observable loading = false;

  @observable status = '';

  @observable id: string = '';

  @observable struture?: DatabaseStructureStore ;

  @observable label = '';

  errorStore: ErrorStore

  constructor(errorStore: ErrorStore, id = '') {
    this.errorStore = errorStore;
    if (id !== '') {
      // load data from storage
      this.loadSavedData(id);
    } else {
      // give id
      this.id = uuid();
    }
  }

  @computed get connectionData(): ConnectionData {
    return {
      server: this.server,
      database: this.database,
      username: this.username,
      password: this.password,
      port: this.port,
      dbms: this.dbms,
      label: this.label,
    };
  }

  @computed get cLabel() {
    if (this.label || this.label === '') {
      return this.label;
    }
    return `${this.server}:${this.database}`;
  }

  saveData = async () => {
    try {
      fileStore.set(`connection_${this.id}`, this.connectionData);
    } catch (e) {
      console.error(e);
    }
  };

  @action loadDatabaseStructure() {
    if (!this.struture) {
      this.struture = new DatabaseStructureStore(this, this.errorStore, this.id);
    }
  }

  @action
  loadSavedData = async (id: string) => {
    try {
      const data: ConnectionData = fileStore.get(`connection_${id}`);

      if (data) {
        this.server = data.server;
        this.database = data.database;
        this.username = data.username;
        this.password = data.password;
        this.id = id;
        this.port = data.port;
        this.dbms = data.dbms;
        this.label = data.label;
      }
    } catch (e) {
      console.error(e);
    }
  };

  async testConnection() {
    this.loading = true;
    DatabaseManager.connect(this.connectionData).then(() => {
      this.loading = false;
      this.status = 'Success';
    }).catch((e) => {
      this.loading = false;
      this.status = 'Error establising connection. Verify that you have entered the correct credentials and that you are on the same network as the server';

      console.log(e, 'message:', e.message, e.name, e.stack, e.description);
      console.log(e.name);

      this.errorStore.add('Error establising connection. Verify that you have entered the correct credentials and that you are on the same network as the server', e.message);
    });
  }
}
