import {
  observable, action,
} from 'mobx';
import ConnectionStore from './Connection';

const FileStore = window.require('electron-store');
const fileStore = new FileStore();

export default class ConnectionsStore {
  @observable connections: ConnectionStore[] = [];

  constructor() {
    // load initial data
    this.loadSavedData();
  }

  saveData = async (connections: string[]) => {
    // console.log(connections);
    try {
      await fileStore.set('ConnectionStore', connections);
    } catch (e) {
      console.error(e);
    }
  };

  // clearAllData() {
  //   fileStore.clear();
  // }

  loadSavedData = async () => {
    try {
      const data = fileStore.get('ConnectionStore');
      // console.log(data);
      // const connections = JSON.parse(data);
      if (data) {
        // this.autoSave = false;
        for (const index in data) {
          // console.log(data[index]);

          this.connections.push(new ConnectionStore(data[index]));
          // console.log(this.connections);
        }
        // this.autoSave = true;
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
