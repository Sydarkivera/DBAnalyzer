import {
  observable, reaction, computed, IReactionDisposer, action,
} from 'mobx';

import ConnectionStore from './Connection';
import ConnectionsStore from './Connections';
import TableStore from './Table';
import ErrorStore from './ErrorStore';

const FileStore = window.require('electron-store');
const fileStore = new FileStore();

export default class SelectedStore {
  @observable connection: ConnectionStore;

  @observable table?: TableStore;

  @observable autoSave: boolean = true;

  saveHandler: IReactionDisposer;

  connectionList: ConnectionsStore;

  errorStore: ErrorStore

  constructor(connectionList: ConnectionsStore, errorStore: ErrorStore) {
    this.connectionList = connectionList;
    this.errorStore = errorStore;
    [this.connection] = connectionList.connections;

    this.loadSaveData();

    this.saveHandler = reaction(
      () => this.asJson,
      (json) => {
        if (this.autoSave) {
          this.saveData(json);
        }
      },
    );
  }

  @computed
  get asJson() {
    return {
      conId: this.connection ? this.connection.id : null,
      tableId: this.table ? this.table.id : null,
    };
  }

  @action loadSaveData() {
    const data = fileStore.get('selected');
    if (data) {
      this.autoSave = false;
      if (data.conId) {
        const foundConnection = this.connectionList.connections.find((item) => {
          if (item.id === data.conId) {
            return true;
          }
          return false;
        });
        if (foundConnection) {
          this.connection = foundConnection;
        }
      }
      if (data.tableId) {
        if (this.connection && this.connection.struture) {
          this.table = this.connection.struture.getTable(data.tableId);
        }
      }
      this.autoSave = true;
    }
  }

  saveData = (data: any) => {
    console.log('saveData', data);

    fileStore.set('selected', data);
  };
}
