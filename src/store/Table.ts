import {
  observable, action, computed, IReactionDisposer, reaction,
} from 'mobx';
import { v4 as uuid } from 'uuid';
import DatabaseManager from '../database';
import { ForeignKeyStructure, ColumnStructure } from '../database/structures';
// import DatabaseStructureStore from './DatabaseStructure';
import ConnectionStore from './Connection';
import { permutations, removeDoubles, testKeyLikeliness } from '../functions/permutations';
import { getSQLColumnsFromList } from '../functions/sql';

const FileStore = window.require('electron-store');
const fileStore = new FileStore();

export enum ShouldSave {
  Undecided,
  Yes,
  No,
}

export default class TableStore {
  @observable id: string = '';

  @observable tableName = '';

  @observable columns: ColumnStructure[] = [];

  @observable data: any[] = [];

  @observable candidateKeys: any[] = [];

  @observable primaryKeys: string[] = [];

  @observable foreignKeys: ForeignKeyStructure[] = [];

  @observable foundForeignKeys: ForeignKeyStructure[] = [];

  @observable rowCount = 0;

  @observable shouldSave = ShouldSave.Undecided;

      @observable autoSave = true;

  connection: ConnectionStore;

  saveHandler: IReactionDisposer;

  constructor(connection: ConnectionStore, id = '') {
    this.connection = connection;
    this.id = id;

    if (id !== '') {
      // load data from storage
      this.loadSavedData(id);
    } else {
      // give id
      this.id = uuid();
      // this.struture = new DatabaseStructureStore(this);
    }

    this.saveHandler = reaction(
      () => this.json,
      (json) => {
        // console.log("updated", json);
        if (this.autoSave) {
          this.saveData();
        }
      },
    );
  }

  loadSavedData(id: string) {
    const data = fileStore.get(`table_${id}`);
    // console.log(data);
    if (data) {
      this.autoSave = false;
      this.tableName = data.tableName;
      this.columns = data.columns;
      this.rowCount = data.rowCount;
      this.shouldSave = data.shouldSave;
      this.candidateKeys = data.candidateKeys || [];
      this.foreignKeys = data.foreignKeys || [];
      this.foundForeignKeys = data.foundForeignKeys || [];
      this.autoSave = true;
    }
  }

  saveData() {
    // console.log('save', this.json);
    // fileStore.set("selected", data);
    // console.log("saveData");
    // console.log(data, this.id);
    try {
      fileStore.set(`table_${this.id}`, this.json);
    } catch (e) {
      console.error(e);
    }
  }

  @computed get json() {
    return {
      tableName: this.tableName,
      columns: this.columns,
      rowCount: this.rowCount,
      shouldSave: this.shouldSave,
      candidateKeys: this.candidateKeys,
      foreignKeys: this.foreignKeys,
      foundForeignKeys: this.foundForeignKeys,
    };
  }

  @action async fetchColumns() {
    // console.log('fetch columns');

    // console.log(this.columns);

    // if (this.columns.length > 0) {
    //   return;
    // }

    const columns = await DatabaseManager
      .fetchColumns(this.connection.connectionData, this.tableName);

    this.primaryKeys = await DatabaseManager
      .fetchPrimaryKeys(this.connection.connectionData, this.tableName);

    const fkeys = await DatabaseManager
      .fetchForeignKeys(this.connection.connectionData, this.tableName);

    this.foreignKeys = fkeys;

    const data = [];
    // console.log(fkeys);

    for (const index in columns) {
      // console.log(columns[index]);

      const columnData: ColumnStructure = {
        columnName: columns[index].COLUMN_NAME,
        dataType: columns[index].DATA_TYPE,
        primaryKey: false,
        foreignKeys: [],
        isNull: false,
      };
      // check if foreign key
      if (this.primaryKeys.includes(columnData.columnName)) {
        columnData.primaryKey = true;
      }

      // check if the column is a foreign key
      for (const foreignKey of this.foreignKeys) {
        for (const fColumn of foreignKey.columns) {
          if (fColumn.fkColumn === columnData.columnName) {
            columnData.foreignKeys.push(foreignKey);
          }
        }
      }
      data.push(columnData);
    }
    this.columns = data;
    // console.log(this.columns);

    // await this.loadNullColumns();
  }

  async fetchData(start: number, end: number) {
    if (!this.columns || this.columns.length <= 0) {
      return; // TODO: fetch columns instead
    }
    const res = await DatabaseManager
      .fetchData(this.connection.connectionData,
        this.tableName, start, end, this.columns[0].columnName);
    this.data = res;
    // console.log(res);
  }

  @action async findNullColumns() {
    for (const i in this.columns) {
      // console.log(i, this.columns.length);
      const column = this.columns[i];
      const excluded = ['image'];
      // column["isNull"] = false;
      column.isNull = false;
      if (excluded.indexOf(column.dataType) < 0) {
        const r = await DatabaseManager
          .checkIfColumnIsNull(this.connection, this.tableName, column.columnName);
        if (r.length <= 0) {
          // all null
          console.log('null');

          column.isNull = true;
        }
      }
    }
  }

  // ------------------ (( Finding potential candidate keys )) ------------------------ //

  async findCandidateKeys() {
    const possibleColumns = [];
    const { columns } = this;
    let index;
    // if (!this.candidateKeys) {
    this.candidateKeys = [];
    // }
    for (index in columns) {
      const column = columns[index];
      // console.log(this.props.selectedStore.table.tableName);
      // console.log(column.columnName);
      // console.log(column.dataType);
      if (
        column.dataType !== 'binary'
        && column.dataType !== 'bit'
        && column.dataType !== 'image'
        && column.dataType !== 'text'
        && column.dataType !== 'xml'
        && column.dataType !== 'ntext'
        && column.isNull === false
      ) {
        possibleColumns.push(column);
      }
    }

    const rowCount = await DatabaseManager.countNumberofRows(this.connection, this.tableName);

    // let tcRes = await executeSQLQuery(
    //   "SELECT COUNT(*) as count FROM [" + this.tableName + "]"
    // );
    // // console.log(tcRes);
    // var tableCount = tcRes[0]["count"];

    console.log(rowCount);

    await this.testCombinationsAlternative(possibleColumns, rowCount);
    this.saveData();
  }

  async testCombinationsAlternative(array: any[], tableCount: number) {
    // console.log(array);
    // start with all, then remove one at a time until it is no longer distinct.
    let res = await this.testIfAnyCombinationIsPossible(array, tableCount);
    // console.log("res:", res);
    if (!res) {
      // there are no unique row in the table. stop searching.
      return;
    }
    const current = [...array];
    for (let index = 0; index < current.length; index++) {
      const temp = [...current];
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
      const n = current.map((item) => ({
        columnName: item.columnName,
        dataType: item.dataType,
      }));
      // console.log(n);
      this.candidateKeys.push(n);
      console.log(
        'candidate:',
        current.map((item) => item.columnName),
      );

      let newArray = [...array];
      for (let i = 0; i < current.length; i++) {
        newArray = newArray.filter((item) => item.columnName !== current[i].columnName);
      }
      await this.testCombinationsAlternative(newArray, tableCount);
    }
  }

  async testIfAnyCombinationIsPossible(columns: ColumnStructure[], tableCount: number) {
    if (columns.length <= 0) {
      return false;
    }
    const uniqueRows = await DatabaseManager
      .countUniqueRows(this.connection, this.tableName, columns);
    if (uniqueRows === tableCount) {
      return true;
    }
    return false;
  }

  // ------------------ (( Finding potential foreign keys )) ------------------------ //

  async findForeignKeys(allTables: TableStore[]) {
    // await mssql.connect(this.store.connection.databaseConfig);s

    // this.foundForeignKeys = [];
    const selectedTable = this;
    // TODO make better solution
    if (this.rowCount < 1) {
      return;
    }
    // let allTables = this.props.selectedStore.connection.databaseStructure
    //   .tables;
    console.log('starting foreign key search on table: ', this.tableName);
    for (const index in selectedTable.candidateKeys) {
      const key = selectedTable.candidateKeys[index];
      // for every table check if any set of columns contain this key.
      // console.log(toJS(this.props.selectedStore.connection.databaseStructure));
      // console.log(toJS(allTables));
      for (const tableIndex in allTables) {
        const table = allTables[tableIndex];
        if (table.rowCount > 0 && table.tableName !== selectedTable.tableName) {
          const possibleColumns = [];
          // find number of columns
          for (const keyIndex in key) {
            const keyColumn = key[keyIndex];
            const pos = [];
            for (const columnIndex in table.columns) {
              const column = table.columns[columnIndex];
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
            // test if all valuess of the candidate key exists in the potential column
            // console.log(possibleColumns);
            let tests = 0;
            const t = [];
            for (let i = 0; i < possibleColumns.length; i++) {
              const q = [];
              for (let j = 0; j < possibleColumns[i].length; j++) {
                if (!possibleColumns[i][j].isNull) {
                  const exists = await DatabaseManager
                    .testIfValuesInColumnExistInOtherTable(this.connection,
                      this.tableName, key[i].columnName,
                      table.tableName, possibleColumns[i][j].columnName);

                  tests += 1;
                  if (exists) {
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

            // console.log("tested columns: ", tests);
            // console.log(t);
            if (t.length === key.length) {
              // test the posssible permutations
              let perms = permutations(t);
              // console.log("have doubles", perms);
              perms = removeDoubles(perms);
              // console.log("removed doubles", perms);
              // console.log(perms.length);
              for (let i = 0; i < perms.length; i++) {
                // if ((i + 1) % 500 === 0) {
                //   console.log(i);
                // }

                const exists = await DatabaseManager
                  .testIfForeignKey(this.connection, this.tableName,
                    key, table.tableName, perms[i]);

                // test if all rows in the foreign key columns exists in the candidatekey
                // columns. If they exists, then a possible key is found.
                // let r = await executeSQLQuery(
                // "IF NOT EXISTS \n( SELECT\n " +
                //   getSQLColumnsFromList(perms[i]) +
                //   " FROM [" +
                //   table.tableName +
                //   "] WHERE\n " +
                //   getSQLNotNULLFromList(perms[i]) +
                //   " \nEXCEPT SELECT " +
                //   getSQLColumnsFromList(key) +
                //   " FROM [" +
                //   selectedTable.tableName +
                //   "] ) \nSELECT 'exists' as res ELSE SELECT 'not' as res"
                // );
                // console.log(r);
                if (exists) {
                  table.foundForeignKeys = [...table.foundForeignKeys, {
                    fkTable: table.tableName,
                    pkTable: this.tableName,
                    columns: perms[i].map((item: any, j: number) => ({
                      fkColumn: item.columnName,
                      pkColumn: key[j].columnName,
                    })),
                  }];
                  console.log(
                    'Foreign key found. PKTable: ',
                    this.tableName,
                    ', PKColumns: ',
                    getSQLColumnsFromList(key),
                    'FKTable: ',
                    table.tableName,
                    ', FKColumns: ',
                    getSQLColumnsFromList(perms[i]),
                  );
                }
              }
            }
          }
        }
      }
    }
    // console.log(JSON.stringify(this.foundForeignKeys));
    // this.saveData(this.asJson);
    // console.log("foreign done");
    this.saveData();
  }

  tablesLinkintToThis(
    tables: TableStore[], ignoreFoundKeys: boolean, likelinessThreshold: number,
  ): ForeignKeyStructure[] {
    const initiallState: ForeignKeyStructure[] = [];
    return tables.reduce(
      (reducer, t) => {
        let keys = t.foreignKeys.filter((item) => item.pkTable === this.tableName);

        if (!ignoreFoundKeys) {
          // search in found keys aswell.
          keys = [
            ...keys,
            ...t.foundForeignKeys.filter(
              (item) => item.pkTable === this.tableName
               && testKeyLikeliness(item, likelinessThreshold),
            ),
          ];
        }

        // console.log(keys);
        if (keys.length > 0) {
          return [
            ...reducer,
            ...keys.map((item) => ({ ...item })),
          ];
        }

        return reducer;
      },
      initiallState,
    );
  }

  hasRelations(
    tables: TableStore[], ignoreFoundKeys: boolean, likelinessThreshold: number,
  ): boolean {
    if (this.foreignKeys.length > 0) {
      return true;
    }

    if (!ignoreFoundKeys && this.foundForeignKeys.length > 0) {
      if (this.foundForeignKeys.filter(
        (key) => testKeyLikeliness(key, likelinessThreshold),
      ).length > 0) {
        return true;
      }
    }

    // no keys pointing fromoo this to another table exist.
    // Test if any table is pointing on this.

    if (this.tablesLinkintToThis(tables, ignoreFoundKeys, likelinessThreshold).length > 0) {
      return true;
    }

    return false;
  }
}
