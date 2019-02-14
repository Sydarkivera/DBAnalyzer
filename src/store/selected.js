import { observable, reaction, computed } from "mobx";

import { Connection } from "./connections";

const FileStore = window.require("electron-store");
const fileStore = new FileStore();

export class Selected {
  @observable connection: Connection = null;
  @observable table = "";
  shouldSave = true;
  autoSave = true;

  constructor(connectionStore) {
    const data = fileStore.get("selected");
    if (data) {
      this.autoSave = false;
      if (data.conId) {
        console.log(data.conId);
        this.connection = connectionStore.connections.find(item => {
          if (item.id === data.conId) {
            return true;
          }
          return false;
        });
      }
      this.table = data.table;
      this.autoSave = true;
    }

    this.saveHandler = reaction(
      () => this.asJson,
      json => {
        if (this.autoSave) {
          this.saveData(json);
        }
      }
    );
  }

  @computed
  get asJson() {
    return {
      conId: this.connection ? this.connection.id : null,
      table: this.table
    };
  }

  saveData = data => {
    fileStore.set("selected", data);
    // fileStore.set("selected_connection", this.table);
  };
}
