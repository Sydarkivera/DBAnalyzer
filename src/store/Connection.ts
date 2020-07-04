import {
  observable, action, computed,
} from 'mobx';
import { v4 as uuid } from 'uuid';
import DatabaseManager from '../database';
import { ConnectionData } from '../database/structures';
import DatabaseStructureStore from './DatabaseStructure';

const FileStore = window.require('electron-store');
const fileStore = new FileStore();

export default class ConnectionStore {
  @observable username = '';

  @observable password = '';

  @observable server = '';

  @observable database = '';

  @observable port = 0;

  @observable dbms = '';

  @observable loading = false;

  @observable status = '';

  @observable id: string = '';

  @observable struture: DatabaseStructureStore;

  @observable label = '';

  constructor(id = '') {
    if (id !== '') {
      // load data from storage
      this.loadSavedData(id);
    } else {
      // give id
      this.id = uuid();
    }
    this.struture = new DatabaseStructureStore(this, id);
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

  @action
  loadSavedData = async (id: string) => {
    try {
      const data: ConnectionData = fileStore.get(`connection_${id}`);
      // console.log(data);

      if (data) {
        // this.autoSave = false;
        this.server = data.server;
        this.database = data.database;
        this.username = data.username;
        this.password = data.password;
        this.id = id;
        this.port = data.port;
        this.dbms = data.dbms;
        this.label = data.label;
        // this.struture = new DatabaseStructureStore(this, this.id);
        // this.fetchDatabaseStrucutre();
        // this.autoSave = true;
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
    }).catch(() => {
      this.loading = false;
      this.status = 'Error establising connection. Verify that you have entered the correct credentials and that you are on the same network as the server';
    });
  }
}