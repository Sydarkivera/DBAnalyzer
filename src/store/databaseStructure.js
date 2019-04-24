import { observable, reaction, computed, action } from "mobx";
import { Connection } from "./connections";
import { testLikness } from "../functions/permutations";
import { Table } from "./table.js";

const FileStore = window.require("electron-store");
const fileStore = new FileStore();

const mssql = window.require("mssql");

export class DatabaseStructure {
  // @observable numberOfEmptyTables = 0;
  // @observable totalNumberOfRows = 0;
  @observable tables = [];
  @observable loading = true;
  @observable saveDataLoaded = false;

  @observable tableStructureLoaded = 0;
  @observable tableCandidateKeysLoaded = 0;
  @observable tableForeignKeysLoaded = 0;
  @observable columnsCheckedFoNull = 0;
  @observable numberOfTablesWithOneColumn = 0;
  @observable step = 0;
  @observable tablesToVerify = [];

  connection: Connection = null;
  autoSave = true;

  constructor(connection) {
    this.connection = connection;

    this.saveHandler = reaction(
      () => this.asJson,
      json => {
        // console.log("updated", json);
        if (this.autoSave) {
          this.saveData(json);
        }
      }
    );
  }

  findTable(tableName) {
    // await this.fetchAllTables();
    return this.connection.databaseStructure.tables.find(item => {
      if (item.tableName === tableName) {
        return true;
      }
      return false;
    });
  }

  getTable(tableId) {
    if (this.tables.length === 0) {
      let table = new Table(this, tableId);
      console.log(tableId);
      // this.tables.push(table);
      console.log(table);
      return table;
    } else {
      this.table = this.connection.databaseStructure.tables.find(item => {
        if (item.id === tableId) {
          return true;
        }
        return false;
      });
    }
  }

  async loadSavedData() {
    // return false;
    return new Promise(resolve => {
      setTimeout(() => {
        try {
          const data = fileStore.get("database_" + this.connection.id, null);
          if (data !== null) {
            this.autoSave = false;
            // console.log(this.progressInformation);
            // this.progressInformation = data.progressInformation;
            // console.log(data.progressInformation, this.progressInformation);
            // console.log("loaded progressinfo");
            this.tableStructureLoaded = data.tableStructureLoaded;
            this.tableCandidateKeysLoaded = data.tableCandidateKeysLoaded;
            this.tableForeignKeysLoaded = data.tableForeignKeysLoaded;
            this.columnsCheckedFoNull = data.columnsCheckedFoNull;
            this.numberOfTablesWithOneColumn = data.numberOfTablesWithOneColumn;
            this.step = data.step;
            this.tablesToVerify = data.tablesToVerify
              ? data.tablesToVerify
              : [];
            for (let index in data.tables) {
              this.tables.push(new Table(this, data.tables[index]));
            }
            // return true;
            this.loading = false;
            this.autoSave = true;
            resolve(true);
            this.saveDataLoaded = true;
          } else {
            // return false;
            resolve(false);
          }
        } catch (err) {
          console.error(err);
          resolve(false);
        }
      }, 100);
    });
  }

  saveData = async data => {
    // fileStore.set("selected", data);
    // console.log(data);
    try {
      await fileStore.set("database_" + this.connection.id, data);
    } catch (e) {
      console.error(e);
    }
  };

  @computed
  get asJson() {
    return {
      tableStructureLoaded: this.tableStructureLoaded,
      tableCandidateKeysLoaded: this.tableCandidateKeysLoaded,
      tableForeignKeysLoaded: this.tableForeignKeysLoaded,
      columnsCheckedFoNull: this.columnsCheckedFoNull,
      numberOfTablesWithOneColumn: this.numberOfTablesWithOneColumn,
      step: this.step,
      tables: this.tables.map(table => {
        return table.id;
      }),
      // tableLength: this.tables.length
      tablesToVerify: this.tablesToVerify
    };
  }

  @action
  async fetchAllTables() {
    if (this.saveDataLoaded === true) {
      console.log("tables already loaded");
      return this.tables;
    }
    let res = await this.loadSavedData();
    console.log(res);
    if (!res) {
      await mssql.connect(this.connection.databaseConfig);
      // create Request object
      var request = new mssql.Request();
      const result = await request.query(
        "SELECT SCHEMA_NAME(schema_id) AS [SchemaName],[Tables].name AS [TableName],SUM([Partitions].[rows]) AS [TotalRowCount]FROM sys.tables AS [Tables] JOIN sys.partitions AS [Partitions]ON [Tables].[object_id] = [Partitions].[object_id] AND [Partitions].index_id IN ( 0, 1 ) GROUP BY SCHEMA_NAME(schema_id), [Tables].name;"
      );
      // console.log(result);

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
      this.saveData(this.asJson).then(() => {
        console.log("data saved");
      });
      this.loading = false;
    }
    this.saveDataLoaded = true;
    return this.tables;
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
  get numberOfNonEmptyTables() {
    let num = 0;
    for (let index in this.tables) {
      let table = this.tables[index];
      if (table.rowCount > 0) {
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

  // steps for analysing the data:

  async analyseTableStructures() {
    this.tableStructureLoaded = 0;
    for (let key in this.tables) {
      let table = this.tables[key];
      if (table.rowCount > 0) {
        await table.loadColumnData();
        this.tableStructureLoaded += 1;
      }
    }
  }
  async findNullColumns() {
    this.columnsCheckedFoNull = 0;
    for (let key in this.tables) {
      let table = this.tables[key];
      if (table.rowCount > 0) {
        // await table.loadNullColumns();
        this.columnsCheckedFoNull += 1;
      }
    }
  }
  async findRemovableTablesBasedOnSize() {
    this.numberOfTablesWithOneColumn = 0;
    for (let key in this.tables) {
      let table = this.tables[key];
      if (table.rowCount > 0) {
        if (table.columns.length <= 1) {
          this.numberOfTablesWithOneColumn += 1;
          this.tablesToVerify.push({
            tables: [table.tableName],
            reason: "Only have one column",
            type: "oneColumn"
          });
          // table.shouldSave = false;
        }
        // await table.findForeignKeys();
        // this.numberOfTablesWithOneColumn += 1;
      }
    }
  }

  async findCandidateKeys() {
    this.tableCandidateKeysLoaded = 0;
    for (let key in this.tables) {
      let table = this.tables[key];
      if (table.rowCount > 0) {
        await table.findCandidateKeys();
        this.tableCandidateKeysLoaded += 1;
      }
    }
  }

  async findForeignKeys() {
    this.tableForeignKeysLoaded = 0;
    for (let key in this.tables) {
      let table = this.tables[key];
      if (table.rowCount > 0) {
        await table.findForeignKeys(this.tables);
        this.tableForeignKeysLoaded += 1;
      }
    }
  }

  async findIslands() {
    let emptyTables = [];
    let pointedOnNames = new Set();
    for (let key in this.tables) {
      let table = this.tables[key];
      if (table.rowCount > 0) {
        if (table.foreignKeys.length === 0) {
          emptyTables.push(table);
        } else {
          for (let i = 0; i < table.foreignKeys.length; i++) {
            pointedOnNames.add(table.foreignKeys[i].pkTable);
          }
        }
      }
    }
    console.log(emptyTables.length);
    let res = [];
    let sets = [];
    for (let emptyKey in emptyTables) {
      let emptyTable = emptyTables[emptyKey];
      if (!pointedOnNames.has(emptyTable.tableName)) {
        res.push(emptyTable);
        // emptyTable.shouldSave = false;
        this.tablesToVerify.push({
          reason: "Table with no relations",
          tables: [emptyTable.tableName],
          type: "single"
        });
      }
    }
    console.log(
      "emptyTables",
      res.map(item => {
        return item.tableName;
      })
    );

    // find disjoint sets.

    let t;
    let validTables = [];
    for (let i = 0; i < this.tables.length; i++) {
      if (this.tables[i].rowCount > 1 && this.tables[i].shouldSave === true) {
        validTables.push(this.tables[i]);
      }
    }
    while (validTables.length > 0) {
      t = validTables[0];
      let firstSet = new Set();
      firstSet.add(t.tableName);
      // console.log(t);
      this.checkSet(firstSet, t, this.tables);
      // console.log("found set: ", firstSet);
      sets.push(firstSet);
      // console.log(newSet);
      // let r = [];
      validTables = validTables.filter(item => {
        return !firstSet.has(item.tableName);
      });
      // for (let i = 0; i < tables.length; i++) {
      //   if (tables[i].rowCount > 1 && tables[i].shouldSave === true) {
      //     if (!firstSet.has(tables[i].tableName)) {
      //       r.push(tables[i].tableName);
      //     }
      //   }
      // }
    }

    var largestSet = 0;
    for (let i = 0; i < sets.length; i++) {
      if (sets[i].size > sets[largestSet].size) {
        largestSet = i;
      }
    }
    for (let i = 0; i < sets.length; i++) {
      if (sets[i].size < sets[largestSet].size) {
        this.tablesToVerify.push({
          reason: "A set of tables that don't link to the main set",
          tables: [...sets[i]],
          type: "island"
        });
      }
    }
    console.log(this.tablesToVerify);
    console.log(sets);
  }

  checkSet(existing, t, tables) {
    const liknessThreshold = 0.8;
    // console.log(t);
    // console.log(t.tableName);
    let newSet = new Set();
    for (let i = 0; i < t.foreignKeys.length; i++) {
      // add referenced table.
      // firstSet.add(t.foreignKeys[i].pkTable);
      // console.log(t.foreignKeys[i]);
      // return;
      if (
        testLikness(
          t.foreignKeys[i].pkColumn.map(item => {
            return item.columnName;
          }),
          t.foreignKeys[i].pointingOnColumn.map(item => {
            return item.columnName;
          })
        ) > liknessThreshold
      ) {
        if (!existing.has(t.foreignKeys[i].pkTable)) {
          existing.add(t.foreignKeys[i].pkTable);
          newSet.add(
            tables.find(item => {
              return t.foreignKeys[i].pkTable === item.tableName;
            })
          );
        }
      }
    }
    for (let i = 0; i < tables.length; i++) {
      if (tables[i].foreignKeys && tables[i].shouldSave === true) {
        for (let j = 0; j < tables[i].foreignKeys.length; j++) {
          if (tables[i].foreignKeys[j].pkTable === t.tableName) {
            if (
              testLikness(
                tables[i].foreignKeys[j].pkColumn.map(item => {
                  return item.columnName;
                }),
                tables[i].foreignKeys[j].pointingOnColumn.map(item => {
                  return item.columnName;
                })
              ) > liknessThreshold
            ) {
              if (!existing.has(tables[i].tableName)) {
                existing.add(tables[i].tableName);
                newSet.add(tables[i]);
              }
            }
          }
        }
      }
    }

    newSet.forEach(item => {
      this.checkSet(existing, item, tables);
    }, this);

    // for (let i = 0; i < newSet.size; i++) {
    //   this.checkSet(existing, newSet[i], tables);
    // }
    // console.log(existing);
  }
}
