import {
  observable, action,
} from 'mobx';
import ConnectionStore from './Connection';
import ErrorStore from './ErrorStore';

const FileStore = window.require('electron-store');
const fileStore = new FileStore();

export default class ConnectionsStore {
  @observable connections: ConnectionStore[] = [];

  errorStore: ErrorStore

  constructor(errorStore: ErrorStore) {
    // load initial data
    this.errorStore = errorStore;
    this.loadSavedData();
  }

  saveData = async (connections: string[]) => {
    try {
      await fileStore.set('ConnectionStore', connections);
    } catch (e) {
      console.error(e);
    }
  };

  loadSavedData = async () => {
    try {
      const data = fileStore.get('ConnectionStore');
      if (data) {
        for (const index in data) {

          this.connections.push(new ConnectionStore(this.errorStore, data[index]));
        }
      } else {
        // create default data
      }
    } catch (err) {
      console.error(err);
    }
  };

  @action delete(id: string) {
    this.connections = this.connections.filter((item) => item.id !== id);
    this.saveData(this.connections.map((connection) => connection.id));
  }

  @action addConnection(connection: ConnectionStore) {
    connection.saveData();
    this.connections.push(connection);
    this.saveData(this.connections.map((con) => con.id));
  }
}
