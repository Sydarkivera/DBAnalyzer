import MSSQL from './mssql';
import MYSQL from './mysql';
import { ConnectionData, ForeignKeyStructure, ColumnStructure } from './structures';

// import stores from '../store';

// const { errorStore } = stores;

// console.log(errorStore);

export default {

  async connect(connectionData: ConnectionData) {
    // console.log(`testing ${connectionData.dbms} connection`);

    if (connectionData.dbms === 'mssql') {
      return MSSQL.connect(connectionData);
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.connect(connectionData);
    }
    throw new Error(`Unknown DBMS: ${connectionData.dbms} in connect`);
  },

  async fetchAllTables(connectionData: ConnectionData) {
    if (connectionData.dbms === 'mssql') {
      return MSSQL.fetchAllTables(connectionData);
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.fetchAllTables(connectionData);
    }
    throw new Error(`Unknown DBMS: ${connectionData.dbms} in fetchAllTables`);
  },

  async fetchColumns(connectionData: ConnectionData, tableName: string) {
    if (connectionData.dbms === 'mssql') {
      return MSSQL.fetchColumns(connectionData, tableName);
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.fetchColumns(connectionData, tableName);
    }
    throw new Error(`Unknown DBMS: ${connectionData.dbms} in fetchColumns`);
  },

  async fetchData(
    connectionData: ConnectionData,
    tableName: string, start: number, end: number, columnName: string,
  ) {
    if (connectionData.dbms === 'mssql') {
      return MSSQL.fetchData(connectionData, tableName, start, end, columnName);
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.fetchData(connectionData, tableName, start, end, columnName);
    }
    throw new Error(`Unknown DBMS: ${connectionData.dbms} in fetchData`);
  },
  async fetchPrimaryKeys(connectionData: ConnectionData, tableName: string): Promise<string[]> {
    if (connectionData.dbms === 'mssql') {
      return MSSQL.fetchPrimaryKeys(connectionData, tableName);
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.fetchPrimaryKeys(connectionData, tableName);
    }
    throw new Error(`Unknown DBMS: ${connectionData.dbms} in fetchPrimaryKeys`);
  },
  async fetchForeignKeys(
    connectionData: ConnectionData,
    tableName: string,
  ): Promise<ForeignKeyStructure[]> {
    if (connectionData.dbms === 'mssql') {
      return MSSQL.fetchForeignKeys(connectionData, tableName);
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.fetchForeignKeys(connectionData, tableName);
    }
    throw new Error(`Unknown DBMS: ${connectionData.dbms} in fetchForeignKeys`);
  },
  async checkIfColumnIsNull(
    connectionData: ConnectionData, tableName: string, columnName: string,
  ): Promise<any[]> {
    if (connectionData.dbms === 'mssql') {
      return MSSQL.checkIfColumnIsNull(connectionData, tableName, columnName);
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.checkIfColumnIsNull(connectionData, tableName, columnName);
    }
    throw new Error(`Unknown DBMS: ${connectionData.dbms} in checkIfColumnIsNull`);
  },
  async countNumberofRows(
    connectionData: ConnectionData, tableName: string,
  ): Promise<number> {
    if (connectionData.dbms === 'mssql') {
      return MSSQL.countNumberofRows(connectionData, tableName);
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.countNumberofRows(connectionData, tableName);
    }
    throw new Error(`Unknown DBMS: ${connectionData.dbms} in countNumberofRows`);
  },
  async countUniqueRows(
    connectionData: ConnectionData, tableName: string, columns: ColumnStructure[],
  ): Promise<number> {
    if (connectionData.dbms === 'mssql') {
      return MSSQL.countUniqueRows(connectionData, tableName, columns);
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.countUniqueRows(connectionData, tableName, columns);
    }
    throw new Error(`Unknown DBMS: ${connectionData.dbms} in countUniqueRows`);
  },
  async testIfValuesInColumnExistInOtherTable(
    connectionData: ConnectionData, candidateTable: string,
    candidateColumn: string, foreignTable: string, foreignColumn: string,
  ): Promise<boolean> {
    if (connectionData.dbms === 'mssql') {
      return MSSQL.testIfValuesInColumnExistInOtherTable(
        connectionData, candidateTable, candidateColumn, foreignTable, foreignColumn,
      );
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.testIfValuesInColumnExistInOtherTable(
        connectionData, candidateTable, candidateColumn, foreignTable, foreignColumn,
      );
    }
    throw new Error(`Unknown DBMS: ${connectionData.dbms} in testIfValuesInColumnExistInOtherTable`);
  },
  // testIfForeignKey(this.connection, this.tableName, key, table.tableName, perms[i]);
  async testIfForeignKey(
    connectionData: ConnectionData,
    candidateTable: string,
    candidateColumns: ColumnStructure[], foreignTable: string, foreignColumns: ColumnStructure[],
  ): Promise<boolean> {
    if (connectionData.dbms === 'mssql') {
      return MSSQL.testIfForeignKey(
        connectionData, candidateTable, candidateColumns, foreignTable, foreignColumns,
      );
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.testIfForeignKey(
        connectionData, candidateTable, candidateColumns, foreignTable, foreignColumns,
      );
    }
    // errorStore.add(`Unknown DBMS: ${connectionData.dbms} in testIfForeignKey`);
    throw new Error(`Unknown DBMS: ${connectionData.dbms} in testIfForeignKey`);
  },

};
