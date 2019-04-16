import { observable, reaction, computed, action } from "mobx";
import uuid from "uuid";
import {
  selectN,
  permutations,
  removeDoubles
} from "../functions/permutations";

import {
  executeSQLQuery,
  getSQLNotNULLFromList,
  getSQLColumnsFromList
} from "../functions/sql";

const FileStore = window.require("electron-store");
const fileStore = new FileStore();

const mssql = window.require("mssql");

export class Table {
  id = null;
  @observable tableName = "";
  @observable columns = [];
  @observable candidateKeys = [];
  @observable foreignKeys = [];
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

    // this.loadColumnData();

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
    // console.log(this.columns);
    // if (this.columns.length > 0) {
    //   return;
    // }
    await mssql.connect(this.store.connection.databaseConfig);
    // create Request object
    var request = new mssql.Request();
    const result = await request.query(
      "SELECT * FROM INFORMATION_SCHEMA.COLUMNS where TABLE_NAME='" +
        this.tableName +
        "'"
    );
    // console.log(result);
    // var request2 = new mssql.Request();
    // const result2 = await request2.query(
    //   "SELECT * FROM INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE where TABLE_NAME='" +
    //     this.tableName +
    //     "'"
    // );
    // console.log(result2);
    // var request3 = new mssql.Request();
    // const result3 = await request3.query(
    //   "SELECT OBJECT_NAME(f.object_id) as ForeignKetConstraintName, OBJECT_NAME(f.parent_object_id) TableName, COL_NAME(fk.parent_object_id,fk.parent_column_id) ColumnName, OBJECT_NAME(fk.referenced_object_id) as ReferencedTableName, COL_NAME(fk.referenced_object_id, fk.referenced_column_id) as ReferencedColumnName\n\n FROM sys.foreign_keys AS f\nINNER JOIN sys.foreign_key_columns AS fk\n ON f.OBJECT_ID = fk.constraint_object_id\n INNER JOIN sys.tables t\n ON fk.referenced_object_id = t.object_id\n WHERE OBJECT_NAME(fk.referenced_object_id) = '" +
    //     this.tableName +
    //     "' or OBJECT_NAME(f.object_id) = '" +
    //     this.tableName +
    //     "'"
    // );
    // console.log(result3);

    var request4 = new mssql.Request();
    const result4 = await request4.query(
      "SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu ON tc.CONSTRAINT_NAME = ccu.Constraint_name WHERE tc.CONSTRAINT_TYPE = 'Primary Key' and tc.TABLE_NAME='" +
        this.tableName +
        "'"
    );
    let primaryKeys = [];
    for (let index in result4) {
      primaryKeys.push(result4[index]["COLUMN_NAME"]);
    }
    // console.log(result4);
    // var request5 = new mssql.Request();
    // const result5 = await request5.query(
    //   "SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu ON tc.CONSTRAINT_NAME = ccu.Constraint_name WHERE tc.CONSTRAINT_TYPE = 'Foreign Key' and tc.TABLE_NAME='" +
    //     this.tableName +
    //     "'"
    // );
    // console.log(result5);

    let foreign_keys = await executeSQLQuery(
      "SELECT f.name AS foreign_key_name, OBJECT_NAME(f.parent_object_id) AS table_name, OBJECT_NAME (f.referenced_object_id) AS referenced_object, COL_NAME(fc.parent_object_id, fc.parent_column_id) AS constraint_column_name, COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS referenced_column_name FROM sys.foreign_keys as f INNER JOIN sys.foreign_key_columns AS fc ON f.object_id = fc.constraint_object_id WHERE f.parent_object_id = OBJECT_ID('" +
        this.tableName +
        "')"
    );
    // console.log(foreign_keys);

    var data = [];
    for (var index in result) {
      let tempStructure = {
        columnName: result[index]["COLUMN_NAME"],
        dataType: result[index]["DATA_TYPE"],
        primaryKey: false,
        foreign_keys: []
      };
      if (primaryKeys.includes(tempStructure.columnName)) {
        tempStructure.primaryKey = true;
      }

      // check if the column is a foreign key
      for (let index in foreign_keys) {
        if (
          foreign_keys[index]["constraint_column_name"] ===
          tempStructure.columnName
        ) {
          tempStructure.foreign_keys.push({
            referenceTable: foreign_keys[index]["referenced_object"],
            referenceColumn: foreign_keys[index]["referenced_column_name"]
          });
        }
      }
      data.push(tempStructure);
    }
    // console.log(data);
    this.columns = data;
  }

  async loadNullColumns() {
    for (let i in this.columns) {
      console.log(i, this.columns.length, this.columns[i]);
      var column = this.columns[i];
      const excluded = ["image"];
      column["isNull"] = false;
      if (excluded.indexOf(column.dataType) < 0) {
        let r;
        if (column.dataType === "varchar") {
          r = await executeSQLQuery(
            'SELECT TOP(1) "' +
              column.columnName +
              '" FROM [' +
              this.tableName +
              '] WHERE "' +
              column.columnName +
              "\" <> 'null' AND \"" +
              column.columnName +
              "\" <> '' AND \"" +
              column.columnName +
              '" IS NOT NULL'
          );
        } else {
          r = await executeSQLQuery(
            'SELECT TOP(1) "' +
              column.columnName +
              '" FROM [' +
              this.tableName +
              '] WHERE "' +
              column.columnName +
              '" IS NOT NULL'
          );
        }
        // console.log(r);
        if (r.length <= 0) {
          // all null
          column["isNull"] = true;
        }
      }
    }
  }

  async findCandidateKeys() {
    var possibleColumns = [];
    let columns = this.columns;
    var index;
    // if (!this.candidateKeys) {
    this.candidateKeys = [];
    // }
    for (index in columns) {
      let column = columns[index];
      // console.log(this.props.selectedStore.table.tableName);
      // console.log(column.columnName);
      // console.log(column.dataType);
      if (
        column.dataType !== "binary" &&
        column.dataType !== "bit" &&
        column.dataType !== "image" &&
        column.dataType !== "text" &&
        column.dataType !== "xml" &&
        column.isNull === false
      ) {
        // r = await this.executeSQLQuery(
        //   "SELECT TOP(1) 'There is at least one non-NULL' AS note FROM \"" +
        //     this.tableName +
        //     '" WHERE "' +
        //     column.columnName +
        //     '" is NULL'
        // );
        // // console.log(r);
        // if (r.length === 0 && column.dataType !== "text") {
        possibleColumns.push(column);
        // }
      }
    }

    let tcRes = await executeSQLQuery(
      "SELECT COUNT(*) as count FROM [" + this.tableName + "]"
    );
    // console.log(tcRes);
    var tableCount = tcRes[0]["count"];
    // console.log(tableCount);

    // Test all possible combinations:
    // await this.testCombinations(possibleColumns, tableCount, 1);
    // console.log("all combinations tested");
    // console.log(this.candidateKeys);
    await this.testCombinationsAlternative(possibleColumns, tableCount);
    // console.log("all combinations tested");
    this.saveData(this.asJson);
  }

  async testCombinationsAlternative(array, tableCount) {
    // console.log(array);
    // start with all, then remove one at a time until it is no longer distinct.
    let res = await this.testIfAnyCombinationIsPossible(array, tableCount);
    // console.log("res:", res);
    if (!res) {
      // there are no unique row in the table. stop searching.
      return;
    }
    let current = [...array];
    for (var index = 0; index < current.length; index++) {
      let temp = [...current];
      // latest = current[index];
      temp.splice(index, 1);
      // test again.
      res = await this.testIfAnyCombinationIsPossible(temp, tableCount);
      if (res) {
        // console.log("still possible");
        // If still possible candidate, remove the item.
        current.splice(index, 1);
        index -= 1;
      }
    }
    if (current.length > 0) {
      // console.log(current);
      let n = current.map(item => {
        // console.log(item);
        return {
          columnName: item.columnName,
          dataType: item.dataType
        };
      });
      // console.log(n);
      this.candidateKeys.push(n);
      console.log(
        "candidate:",
        current.map(item => {
          return item.columnName;
        })
      );
      // console.log(toJS(this.candidateKeys));
      // candidate key found
      // remove these items and try again withouth them.
      let newArray = [...array];
      for (let i = 0; i < current.length; i++) {
        newArray = newArray.filter(item => {
          return item.columnName !== current[i].columnName;
        });
        // index = newArray.indexOf(current[i]);
        // if (index >= 0) {
        //   newArray.splice(i, 1);
        // }
      }
      // console.log(
      //   "rest:",
      //   newArray.map(item => {
      //     return item.columnName;
      //   })
      // );
      await this.testCombinationsAlternative(newArray, tableCount);
    }
  }

  async testCombinations(array, tableCount, n) {
    // console.log(array, tableCount, n);
    let singles = selectN(n, array);
    for (var i = 0; i < singles.length; i++) {
      var columns = '"';
      for (var j = 0; j < singles[i].length - 1; j++) {
        columns += singles[i][j].columnName + '", "';
      }
      columns += singles[i][singles[i].length - 1].columnName + '"';
      // console.log(columns);
      let r = await executeSQLQuery(
        "SELECT Count(*) as count FROM ( SELECT DISTINCT " +
          columns +
          " FROM " +
          this.tableName +
          ") as derived"
      );
      // console.log("count:", r[0]["count"]);
      if (r[0]["count"] === tableCount) {
        console.log("found candidate key!", columns);
        for (var k = 0; k < singles[i].length; k++) {
          array.splice(array.indexOf(singles[i][k]), 1);
        }
        // console.log(singles[i]);
        this.candidateKeys.push([...singles[i]]);
        // restart this level with new array.
        let possible = await this.testIfAnyCombinationIsPossible(
          array,
          tableCount
        );
        if (possible) {
          await this.testCombinations(array, tableCount, n);
        }
        return;
      }
    }
    if (n < array.length) {
      await this.testCombinations(array, tableCount, n + 1);
    }
  }

  async testIfAnyCombinationIsPossible(array, tableCount) {
    if (array.length <= 0) {
      return false;
    }
    var columns = '"';
    for (var j = 0; j < array.length - 1; j++) {
      columns += array[j].columnName + '", "';
    }
    columns += array[array.length - 1].columnName + '"';
    // console.log(columns);
    let r = await executeSQLQuery(
      "SELECT Count(*) as count FROM ( SELECT DISTINCT " +
        columns +
        " FROM [" +
        this.tableName +
        "]) as derived"
    );
    if (r[0]["count"] === tableCount) {
      return true;
    }
    // console.log("false");
    return false;
  }

  async findForeignKeys(allTables) {
    await mssql.connect(this.store.connection.databaseConfig);

    this.foreignKeys = [];
    let selectedTable = this;
    // TODO make better solution
    if (this.rowCount < 2) {
      return;
    }
    // let allTables = this.props.selectedStore.connection.databaseStructure
    //   .tables;
    console.log("starting foreign key search");
    for (let index in selectedTable.candidateKeys) {
      let key = selectedTable.candidateKeys[index];
      // for every table check if any set of columns contain this key.
      // console.log(toJS(this.props.selectedStore.connection.databaseStructure));
      // console.log(toJS(allTables));
      for (let tableIndex in allTables) {
        let table = allTables[tableIndex];
        if (table.rowCount > 0 && table.tableName !== selectedTable.tableName) {
          let possibleColumns = [];
          // find number of columns
          for (let keyIndex in key) {
            let keyColumn = key[keyIndex];
            let pos = [];
            for (let columnIndex in table.columns) {
              let column = table.columns[columnIndex];
              // console.log(column);
              if (column.dataType === keyColumn.dataType) {
                pos.push({ ...column });
              }
            }
            if (pos.length > 0) {
              possibleColumns.push(pos);
            }
          }

          if (possibleColumns.length === key.length) {
            // eliminate the columns that it can't be before doing all iterations.
            // console.log(possibleColumns);
            let tests = 0;
            let t = [];
            for (let i = 0; i < possibleColumns.length; i++) {
              let q = [];
              for (let j = 0; j < possibleColumns[i].length; j++) {
                if (!possibleColumns[i][j].isNull) {
                  let r = await executeSQLQuery(
                    'IF NOT EXISTS ( SELECT "' +
                      possibleColumns[i][j].columnName +
                      '" FROM [' +
                      table.tableName +
                      '] WHERE "' +
                      possibleColumns[i][j].columnName +
                      '" IS NOT NULL EXCEPT SELECT "' +
                      key[i].columnName +
                      '" FROM [' +
                      selectedTable.tableName +
                      "] ) SELECT 'exists' as res ELSE SELECT 'no does not exist' as res"
                  );
                  // console.log(r);
                  tests += 1;
                  if (r[0]["res"] === "exists") {
                    q.push(possibleColumns[i][j]);
                  }
                }
              }
              if (q.length > 0) {
                t.push(q);
              } else {
                break;
              }
            }
            console.log("tested columns: ", tests);
            // console.log(t);
            if (t.length === key.length) {
              // try the possibilities if every column found a match:
              let perms = permutations(t);
              console.log("have doubles", perms);
              perms = removeDoubles(perms);
              console.log("removed doubles", perms);
              // console.log(perms.length);
              for (let i = 0; i < perms.length; i++) {
                if ((i + 1) % 500 === 0) {
                  console.log(i);
                }

                // test
                let r = await executeSQLQuery(
                  "IF NOT EXISTS \n( SELECT\n " +
                    getSQLColumnsFromList(perms[i]) +
                    " FROM [" +
                    table.tableName +
                    "] WHERE\n " +
                    getSQLNotNULLFromList(perms[i]) +
                    " \nEXCEPT SELECT " +
                    getSQLColumnsFromList(key) +
                    " FROM [" +
                    selectedTable.tableName +
                    "] ) \nSELECT 'exists' as res ELSE SELECT 'not' as res"
                );
                // console.log(r);
                if (r[0]["res"] === "exists") {
                  // verify that the target table is not only null.

                  this.foreignKeys.push({
                    pointingOnColumn: key,
                    pkColumn: perms[i],
                    pkTable: table.tableName
                  });
                  // console.log(this.foreignKeys);
                  console.log(
                    "possibility found: ",
                    this.tableName,
                    getSQLColumnsFromList(key),
                    "From:",
                    table.tableName,
                    getSQLColumnsFromList(perms[i])
                  );
                }
              }
            }
          }
        }
      }
    }
    this.saveData(this.asJson);
    console.log("foreign done");
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
      this.candidateKeys = data.candidateKeys;
      this.foreignKeys = data.foreignKeys;
    }
  }

  saveData(data) {
    // console.log("save");
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
      shouldSave: this.shouldSave,
      candidateKeys: this.candidateKeys,
      foreignKeys: this.foreignKeys
    };
  }
}

// export class Column
