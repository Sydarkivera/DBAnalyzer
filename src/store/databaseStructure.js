import { observable, reaction, computed, action, runInAction } from "mobx";
import uuid from "uuid";
import { Connection } from "./connections";

const FileStore = window.require("electron-store");
const fileStore = new FileStore();

const mssql = window.require("mssql");

export class DatabaseStructure {
  // @observable numberOfEmptyTables = 0;
  // @observable totalNumberOfRows = 0;
  @observable tables = [];
  @observable loading = true;

  connection: Connection = null;
  autoSave = true;
  // @observable connection: Connection = null;
  // @observable table = "";
  // shouldSave = true;
  // autoSave = true;
  //
  constructor(connection) {
    this.connection = connection;
    if (!this.loadSavedData()) {
      this.fetchAllTables();
    }
    // if (id) {
    // load structure from file
    // } else {
    // this.tables = [];
    // this.loading = false;
    // }

    this.saveHandler = reaction(
      () => this.tables.length,
      () => {
        if (this.autoSave) {
          this.saveData(this.tables);
        }
      }
    );
  }

  @action
  loadSavedData = () => {
    try {
      const data = fileStore.get("database_" + this.connection.id, null);
      // console.log(data);
      if (data !== null) {
        this.autoSave = false;
        for (let index in data) {
          this.tables.push(new Table(this, data[index]));
        }
        this.loading = false;
        this.autoSave = true;
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error(err);
    }
  };

  saveData = async tables => {
    // fileStore.set("selected", data);
    let data = tables.map(table => {
      return table.id;
    });
    try {
      await fileStore.set("database_" + this.connection.id, data);
    } catch (e) {
      console.error(e);
    }
  };

  @action
  async fetchAllTables() {
    await mssql.connect(this.connection.databaseConfig);
    // create Request object
    var request = new mssql.Request();
    const result = await request.query(
      "SELECT SCHEMA_NAME(schema_id) AS [SchemaName],[Tables].name AS [TableName],SUM([Partitions].[rows]) AS [TotalRowCount]FROM sys.tables AS [Tables] JOIN sys.partitions AS [Partitions]ON [Tables].[object_id] = [Partitions].[object_id] AND [Partitions].index_id IN ( 0, 1 ) GROUP BY SCHEMA_NAME(schema_id), [Tables].name;"
    );

    this.autoSave = false;
    // runInAction(() => {
    let tables = [];
    for (let index in result) {
      let row = result[index];
      let table = new Table(this);
      table.tableName = row["TableName"];
      table.rowCount = parseInt(row["TotalRowCount"], 10);
      tables.push(table);
    }
    this.tables = tables;
    // });
    this.autoSave = true;
    this.saveData(this.tables).then(() => {
      console.log("data saved");
    });
    this.loading = false;
  }

  @computed
  get numberOfEmptyTables() {
    let num = 0;
    for (let index in this.tables) {
      let table = this.tables[index];
      if (table.rowCount === 0) {
        num += 1;
      }
    }
    return num;
  }

  @computed
  get numberOfRowsInTables() {
    let num = 0;
    for (let index in this.tables) {
      let table = this.tables[index];
      num += table.rowCount;
    }
    return num;
  }
}

export class Table {
  id = null;
  @observable tableName = "";
  @observable columns = [];
  @observable rowCount = 0;
  @observable shouldSave = true;

  saveHandler = null;
  autoSave = true;
  store: DatabaseStructure = null;

  constructor(store: DatabaseStructure, id = null) {
    this.store = store;
    if (id !== null) {
      //load saved data
      this.loadSavedData(id);
      this.id = id;
    } else {
      this.id = uuid.v4();
    }

    this.saveHandler = reaction(
      () => this.asJson,
      json => {
        // console.log("reaction");
        if (this.autoSave) {
          this.saveData(json);
        }
      }
    );
  }

  @action
  async loadColumnData() {
    await mssql.connect(this.connection.databaseConfig);
    // create Request object
    var request = new mssql.Request();
    const result = await request.query(
      "SELECT * FROM INFORMATION_SCHEMA.COLUMNS where TABLE_NAME='" +
        this.tableName +
        "'"
    );
    var data = [];
    for (var index in result) {
      // var tempStructure = []
      data.push({
        columnName: result[index]["COLUMN_NAME"],
        dataType: result[index]["DATA_TYPE"]
      });
    }
    this.columns = data;
  }

  loadSavedData(id) {
    const data = fileStore.get("table_" + id);
    // console.log(data);
    if (data) {
      this.autoSave = false;
      this.tableName = data.tableName;
      this.columns = data.columns;
      this.rowCount = data.rowCount;
      this.shouldSave = data.shouldSave;
      this.autoSave = true;
    }
  }

  saveData(data) {
    // fileStore.set("selected", data);
    // console.log("saveData");
    // console.log(data, this.id);
    try {
      fileStore.set("table_" + this.id, data);
    } catch (e) {
      console.error(e);
    }
  }

  @computed
  get asJson() {
    return {
      tableName: this.tableName,
      columns: this.columns,
      rowCount: this.rowCount,
      shouldSave: this.shouldSave
    };
  }
}

// export class Column
