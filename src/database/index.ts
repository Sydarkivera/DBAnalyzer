import MSSQL from './mssql';
import MYSQL from './mysql';
import { ConnectionData, ForeignKeyStructure, ColumnStructure } from './structures';

export default {

  async connect(connectionData: ConnectionData) {
    console.log(`testing ${connectionData.dbms} connection`);

    if (connectionData.dbms === 'mssql') {
      return MSSQL.connect(connectionData);
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.connect(connectionData);
    }
    throw `Unknown DBMS: ${connectionData.dbms}`;
  },

  async fetchAllTables(connectionData: ConnectionData) {
    if (connectionData.dbms === 'mssql') {
      return MSSQL.fetchAllTables(connectionData);
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.fetchAllTables(connectionData);
    }
    throw `Unknown DBMS: ${connectionData.dbms}`;
  },

  async fetchColumns(connectionData: ConnectionData, tableName: string) {
    if (connectionData.dbms === 'mssql') {
      return MSSQL.fetchColumns(connectionData, tableName);
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.fetchColumns(connectionData, tableName);
    }
    throw `Unknown DBMS: ${connectionData.dbms}`;
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
    throw `Unknown DBMS: ${connectionData.dbms}`;
  },
  async fetchPrimaryKeys(connectionData: ConnectionData, tableName: string): Promise<string[]> {
    if (connectionData.dbms === 'mssql') {
      return MSSQL.fetchPrimaryKeys(connectionData, tableName);
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.fetchPrimaryKeys(connectionData, tableName);
    }
    throw `Unknown DBMS: ${connectionData.dbms}`;
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
    throw `Unknown DBMS: ${connectionData.dbms}`;
  },
  async checkIfColumnIsNull(
    connectionData: ConnectionData, tableName: string, columnName: string,
  ): Promise<any[]> {
    if (connectionData.dbms === 'mssql') {
      return MSSQL.checkIfColumnIsNull(connectionData, tableName, columnName);
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.checkIfColumnIsNull(connectionData, tableName, columnName);
    }
    throw `Unknown DBMS: ${connectionData.dbms}`;
  },
  async countNumberofRows(
    connectionData: ConnectionData, tableName: string,
  ): Promise<number> {
    if (connectionData.dbms === 'mssql') {
      return MSSQL.countNumberofRows(connectionData, tableName);
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.countNumberofRows(connectionData, tableName);
    }
    throw `Unknown DBMS: ${connectionData.dbms}`;
  },
  async countUniqueRows(
    connectionData: ConnectionData, tableName: string, columns: ColumnStructure[],
  ): Promise<number> {
    if (connectionData.dbms === 'mssql') {
      return MSSQL.countUniqueRows(connectionData, tableName, columns);
    } if (connectionData.dbms === 'mysql') {
      return MYSQL.countUniqueRows(connectionData, tableName, columns);
    }
    throw `Unknown DBMS: ${connectionData.dbms} in countUniqueRows`;

    return 0;
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
    throw `Unknown DBMS: ${connectionData.dbms} in testIfValuesInColumnExistInOtherTable`;

    return false;
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
    throw `Unknown DBMS: ${connectionData.dbms} in testIfForeignKey`;

    return false;
  },

};

// const mssql = window.require("mssql");
// var mysql = window.require('mysql');

// export function connect(conData:ConnectionData) {

//   return new Promise(async (resolve, reject) => {

// if (conData.dbms === "mysql") {
//   return mysql.connect
//     var con = mysql.createConnection({
//       host: conData.server,
//       user: conData.username,
//       password: conData.password,
//       database: conData.database
//     });

//     con.connect(function(err: any) {
//       if (err) reject(err);
//       resolve(con);
//     });

//   } else if (conData.dbms === "mssql") {
//     await mssql.connect(
//       {
//         server: conData.server,
//         database: conData.database,
//         user: conData.username,
//         password: conData.password
//       },
//       (err: any) => {
//         // var cons = this.props.connectionStore.connections;
//         // con["loading"] = false;
//         if (err) {
//           // this.formConnectionStatus = err["name"];
//           reject(err);
//         } else {
//           // this.formConnectionStatus = "Success";
//           resolve();
//         }
//         // console.log(err);
//         // this.setState({ connections: cons });
//       }
//     );
//   }

//   })

// }

// export async function fetchListOfTables(conData:ConnectionData): Promise<any> {

//   return null;
// }
