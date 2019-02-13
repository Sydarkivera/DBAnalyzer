import { observable } from "mobx";
import uuid from "uuid";

export class Connection {
  id = uuid.v4();
  @observable server = "asf";
  @observable database = "asdf";
  @observable username = "asdf";
  @observable password = "asdf";
  @observable port = 1433;
  @observable loading = false;
  @observable connectionStatus = "Not connected";

  connectionTimeout = 5000;

  constructor(server, database, user, password) {
    this.server = server;
    this.database = database;
    this.user = user;
    this.password = password;
  }
}

export class ConnectionList {
  @observable connections: Array<Connection> = [];

  constructor() {
    this.connections.push(
      new Connection("10.170.70.8\\SQLEXPRESS", "PMOmasterSHV", "PMO", "PMO")
    );
    this.connections.push(
      new Connection("10.170.70.8\\SQLEXPRESS", "tempdb", "PMO", "PMO")
    );
    this.connections.push(
      new Connection("10.170.70.8\\SQLEXPRESS", "test", "PMO", "PMO")
    );
  }
}
