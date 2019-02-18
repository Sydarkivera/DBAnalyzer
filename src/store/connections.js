import { observable, reaction, computed, action } from "mobx";
import uuid from "uuid";

import { DatabaseStructure } from "./databaseStructure";

const FileStore = window.require("electron-store");
const fileStore = new FileStore();

const mssql = window.require("mssql");

export class Connection {
  id = uuid.v4();
  @observable server = "asf";
  @observable database = "asdf";
  @observable username = "asdf";
  @observable password = "asdf";
  @observable port = 1433;
  @observable loading = false;
  @observable connectionStatus = "Not connected";
  @observable databaseStructure = null;

  store = null;
  autoSave = true;
  connectionTimeout = 5000;
  saveHandler = null;

  constructor(store, id = null) {
    this.store = store;
    console.log(id);
    if (id) {
      //load saved data
      this.loadSavedData(id);
    } else {
      this.id = uuid.v4();
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

  saveData = async data => {
    try {
      fileStore.set("connection_" + this.id, data);
    } catch (e) {
      console.error(e);
    }
  };

  loadSavedData = async id => {
    try {
      const data = fileStore.get("connection_" + id);
      if (data) {
        this.autoSave = false;
        this.server = data.server;
        this.database = data.database;
        this.username = data.username;
        this.password = data.password;
        this.id = id;
        this.port = data.port;
        // this.fetchDatabaseStrucutre(data.databaseId);
        this.autoSave = true;
      }
    } catch (e) {}
  };

  fetchDatabaseStrucutre(id) {
    // early exit if structure already exists
    if (this.databaseStructure) {
      return;
    }
    this.databaseStructure = new DatabaseStructure(this);
  }

  @computed
  get asJson() {
    return {
      server: this.server,
      database: this.database,
      username: this.username,
      password: this.password,
      port: this.port,
      databaseId: this.connection ? this.connection.id : null
    };
  }

  @computed
  get databaseConfig() {
    return {
      port: this.port,
      password: this.password,
      user: this.username,
      server: this.server,
      database: this.database,
      connectionTimeout: this.connectionTimeout
    };
  }

  delete() {
    this.store.removeConnection(this);
  }

  dispose() {
    this.saveHandler();
    try {
      fileStore.delete("connection_" + this.id);
    } catch (e) {
      console.error(e);
    }
  }
}

export class ConnectionList {
  @observable connections: Array<Connection> = [];

  saveHandler = null;
  autoSave = true;

  constructor() {
    this.loadSavedData();
    this.saveHandler = reaction(
      () => this.connections.length,
      () => {
        if (this.autoSave) {
          this.saveData(
            this.connections.map(connection => {
              return connection.id;
            })
          );
        }
      }
    );

    // var con = new Connection(this);
    // con.server = "10.170.70.8\\SQLEXPRESS";
    // con.database = "PMOmasterSHV";
    // con.username = "PMO";
    // con.password = "PMO";
    // this.connections.push(
    //   con
    //   // new Connection(
    //   //   this,
    //   //
    //   //   "PMOmasterSHV",
    //   //   "PMO",
    //   //   "PMO"
    //   // )
    // );
    // this.connections.push(
    //   new Connection(this, "10.170.70.8\\SQLEXPRESS", "tempdb", "PMO", "PMO")
    // );
    // this.connections.push(
    //   new Connection(this, "10.170.70.8\\SQLEXPRESS", "test", "PMO", "PMO")
    // );
  }

  saveData = async connections => {
    console.log(connections);
    try {
      await fileStore.set("ConnectionStore", connections);
    } catch (e) {
      console.error(e);
    }
  };

  loadSavedData = async () => {
    try {
      const data = fileStore.get("ConnectionStore");
      // console.log(data);
      // const connections = JSON.parse(data);
      if (data !== null) {
        this.autoSave = false;
        for (let index in data) {
          this.connections.push(new Connection(this, data[index]));
        }
        this.autoSave = true;
      }
    } catch (err) {
      console.error(err);
    }
  };

  createConnection() {
    var connection = new Connection(this);
    this.connections.push(connection);
    return connection;
  }

  removeConnection(connection) {
    this.connections.splice(this.connections.indexOf(connection), 1);
    // connection.dispose();
  }
}
