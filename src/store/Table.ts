import {
  observable, action, computed, IReactionDisposer, reaction,
} from 'mobx';
import { v4 as uuid } from 'uuid';
import DatabaseManager from '../database';
import { ForeignKeyStructure, ColumnStructure } from '../database/structures';
import ConnectionStore from './Connection';
import { permutations, removeDoubles, testKeyLikeliness } from '../functions/permutations';
import { getSQLColumnsFromList } from '../functions/sql';
import ErrorStore from './ErrorStore';

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

  candidateProgress = 0;

  connection: ConnectionStore;

  errorStore: ErrorStore

  saveHandler: IReactionDisposer;

  constructor(connection: ConnectionStore, errorStore: ErrorStore, id = '') {
    this.errorStore = errorStore;
    this.connection = connection;
    this.id = id;

    if (id !== '') {
      // load data from storage
      this.loadSavedData(id);
    } else {
      // give id
      this.id = uuid();
    }

    this.saveHandler = reaction(
      () => this.json,
      (json) => {
        if (this.autoSave) {
          this.saveData();
        }
      },
    );
  }

  loadSavedData(id: string) {
    const data = fileStore.get(`table_${id}`);
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
    try {
      fileStore.set(`table_${this.id}`, this.json);
    } catch (e) {
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
    if (this.columns.length > 0) {
      return;
    }

    const columns = await DatabaseManager
      .fetchColumns(this.connection.connectionData, this.tableName);

    this.primaryKeys = await DatabaseManager
      .fetchPrimaryKeys(this.connection.connectionData, this.tableName);

    const fkeys = await DatabaseManager
      .fetchForeignKeys(this.connection.connectionData, this.tableName);

    this.foreignKeys = fkeys;

    const data = [];

    for (const index in columns) {

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
  }

  async fetchData(start: number, end: number) {
    if (!this.columns || this.columns.length <= 0) {
      return;
    }
    try {
      const res = await DatabaseManager
        .fetchData(this.connection.connectionData,
          this.tableName, start, end, this.columns[0].columnName);
      this.data = res;
    } catch (e) {
      this.errorStore.add(`Error fetching data for table: ${this.tableName}`);
    }
  }

  @action async findNullColumns() {
    const excluded = ['image'];
    for (const i in this.columns) {
      const column = this.columns[i];
      column.isNull = false;
      if (excluded.indexOf(column.dataType) < 0) {
        const r = await DatabaseManager
          .checkIfColumnIsNull(this.connection, this.tableName, column.columnName);

        if (r.length <= 0) {
          column.isNull = true;
        }
      }
    }
  }

  // ------------------ (( Finding potential candidate keys )) ------------------------ //

  async findCandidateKeys() {
    console.log(`finding candidate keys for ${this.tableName}`);

    const possibleColumns = [];
    this.candidateProgress = 0;
    const { columns } = this;
    let index;
    this.candidateKeys = [];
    for (index in columns) {
      const column = columns[index];
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
    let possibilities = possibleColumns.length;
    for (let i = 1; i < possibleColumns.length; i++) {
      possibilities += i;
    }
    console.log('maximum possible tests for candidate keys: ', possibilities);

    await this.testCombinationsAlternative(possibleColumns, rowCount);
    this.saveData();
  }

  async testCombinationsAlternative(array: any[], tableCount: number) {
    console.log(this.candidateProgress);

    // start with all, then remove one at a time until it is no longer distinct.
    let res = await this.testIfAnyCombinationIsPossible(array, tableCount);

    if (!res) {
      // there are no unique row in the table. stop searching.
      return;
    }
    const current = [...array];
    for (let index = 0; index < current.length; index++) {
      const temp = [...current];
      temp.splice(index, 1);
      // test again.
      res = await this.testIfAnyCombinationIsPossible(temp, tableCount);
      if (res) {
        // If still possible candidate, remove the item.
        current.splice(index, 1);
        index -= 1;
      }
    }
    if (current.length > 0) {
      const n = current.map((item) => ({
        columnName: item.columnName,
        dataType: item.dataType,
      }));
      this.candidateKeys.push(n);

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
    console.log('test if any combination is possible', this.candidateProgress);

    this.candidateProgress += 1;
    const uniqueRows = await DatabaseManager
      .countUniqueRows(this.connection, this.tableName, columns);

    if (uniqueRows === tableCount) {
      return true;
    }
    return false;
  }

  // ------------------ (( Finding potential foreign keys )) ------------------------ //

  async findForeignKeys(allTables: TableStore[]) {
    const selectedTable = this;
    // TODO make better solution
    if (this.rowCount < 1) {
      return;
    }
    for (const index in selectedTable.candidateKeys) {
      const key = selectedTable.candidateKeys[index];
      // for every table check if any set of columns contain this key
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
              if (column.dataType === keyColumn.dataType && !column.isNull && !keyColumn.isNull) {
                pos.push({ ...column });
              }
            }
            if (pos.length > 0) {
              possibleColumns.push(pos);
            }
          }

          if (possibleColumns.length === key.length) {
            // test if all valuess of the candidate key exists in the potential column
            const t = [];
            for (let i = 0; i < possibleColumns.length; i++) {
              const q = [];
              for (let j = 0; j < possibleColumns[i].length; j++) {
                if (!possibleColumns[i][j].isNull) {
                  const exists = await DatabaseManager
                    .testIfValuesInColumnExistInOtherTable(this.connection,
                      this.tableName, key[i].columnName,
                      table.tableName, possibleColumns[i][j].columnName);

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

            if (t.length === key.length) {
              // test the posssible permutations
              let perms = permutations(t);
              perms = removeDoubles(perms);
              for (let i = 0; i < perms.length; i++) {

                const exists = await DatabaseManager
                  .testIfForeignKey(this.connection, this.tableName,
                    key, table.tableName, perms[i]);

                // test if all rows in the foreign key columns exists in the candidatekey
                // columns. If they exists, then a possible key is found.

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
