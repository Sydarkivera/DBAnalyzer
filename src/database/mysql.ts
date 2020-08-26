import { Connection } from 'mysql';
import { ConnectionData, ForeignKeyStructure, ColumnStructure } from './structures';
import { getSQLColumnsFromList, getSQLNotNULLFromList } from '../functions/sql';

const mysql = window.require('mysql');

async function connect(connectionData: ConnectionData): Promise<Connection> {
  return new Promise((resolve, reject) => {
    const con: Connection = mysql.createConnection({
      host: connectionData.server,
      user: connectionData.username,
      password: connectionData.password,
      database: connectionData.database,
    });

    con.connect((err: any) => {
      if (err) reject(err);
      resolve(con);
    });
  });
}

async function fetchAllTables(connectionData: ConnectionData) {
  const con: Connection = await connect(connectionData);
  return new Promise((resolve, reject) => con.query(
    `SELECT table_rows as TotalRowCount, TABLE_NAME as TableName FROM information_schema.tables WHERE TABLE_SCHEMA = '${connectionData.database}' and table_type = 'BASE TABLE'`,
    // `SELECT c.table_rows as TotalRowCount, t.TABLE_NAME as TableName FROM information_schema.tables WHERE TABLE_SCHEMA = '${connectionData.database}'`,
    (error, results, fields) => {
    // console.log(error, results, fields);

      // return {error, results, fields}
      if (error) {
        reject(error);
      } else {
        // find the exact number of rows per table

        const promises = results.map((item: any) => getRowCount(con, connectionData, item.TableName));
        Promise.all(promises).then((res: any[]) => {
          resolve(results.map((item:any, i: number) => ({ ...item, inaccurateRowCount: item.TotalRowCount, TotalRowCount: res[i][0].TotalRowCount })));
        }).catch(() => {
          resolve(results);
        });
        // console.log(promises);
      }
      con.end();
    },
  ));
}

async function getRowCount(con: Connection, connectionData: ConnectionData, TableName: string) {
  return new Promise((resolve, reject) => con.query(
    `SELECT COUNT(*) as TotalRowCount FROM ${connectionData.database}.${TableName}`,
    (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    },
  ));
}

async function fetchColumns(connectionData: ConnectionData, tableName: string) {
  const con: Connection = await connect(connectionData);
  return new Promise((resolve, reject) => con.query(
    `SELECT * FROM INFORMATION_SCHEMA.COLUMNS where TABLE_NAME='${
      tableName
    }' AND TABLE_SCHEMA='${connectionData.database}'`,
    (error, results, fields) => {
      // console.log(error, results, fields);

      // return {error, results, fields}
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
      con.end();
    },
  ));
}

async function fetchData(connectionData: ConnectionData, tableName: string, start:number, end:number, columnName: string) {
  const con: Connection = await connect(connectionData);
  return new Promise((resolve, reject) => con.query(
    `SELECT * FROM \`${
      tableName
    }\` LIMIT ${start},${end - start};`,
    (error, results, fields) => {
      // console.log(error, results, fields);

      // return {error, results, fields}
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
      con.end();
    },
  ));
}

async function fetchPrimaryKeys(connectionData: ConnectionData, tableName: string): Promise<string[]> {
  const con: Connection = await connect(connectionData);
  return new Promise((resolve, reject) => con.query(
    `SHOW KEYS FROM \`${tableName}\` WHERE Key_name = 'PRIMARY'`,
    (error, results, fields) => {
      // console.log(error, results, fields);

      // return {error, results, fields}
      if (error) {
        reject(error);
      } else {
        const primaryKeys = [];
        for (const index in results) {
          // console.log(results[index]);

          primaryKeys.push(results[index].Column_name);
        }
        resolve(primaryKeys);
      }
      con.end();
    },
  ));
}

async function fetchForeignKeys(connectionData: ConnectionData, tableName: string): Promise<ForeignKeyStructure[]> {
  const con: Connection = await connect(connectionData);
  return new Promise((resolve, reject) => con.query(
    // `SELECT * FROM INFORMATION_SCHEMA.COLUMNS where TABLE_NAME='${
    //   tableName
    // }'`,
    `SELECT
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
TABLE_NAME = '${tableName}' AND CONSTRAINT_NAME != 'PRIMARY' AND REFERENCED_TABLE_NAME IS NOT NULL`,
    (error, results, fields) => {
      // console.log(error, results, fields);

      // return {error, results, fields}
      if (error) {
        reject(error);
      } else {
        // console.log(results);

        // resolve([]);
        const keys: { [id: string]: ForeignKeyStructure } = {};
        for (const row of results) {
          // console.log(row);

          if (row.CONSTRAINT_NAME in keys) {
          // add column
            keys[row.CONSTRAINT_NAME].columns.push({
              fkColumn: row.COLUMN_NAME,
              pkColumn: row.REFERENCED_COLUMN_NAME,
            });
          } else {
          // add key
            keys[row.CONSTRAINT_NAME] = {
              fkTable: row.TABLE_NAME,
              pkTable: row.REFERENCED_TABLE_NAME,
              columns: [
                {
                  fkColumn: row.COLUMN_NAME,
                  pkColumn: row.REFERENCED_COLUMN_NAME,
                },
              ],

            };
          }
        }
        resolve(Object.values(keys));
      }
      con.end();
    },
  ));
}
async function checkIfColumnIsNull(connectionData: ConnectionData, tableName: string, columnName: string): Promise<any[]> {
  const con: Connection = await connect(connectionData);
  return new Promise((resolve, reject) => con.query(
    `SELECT \`${
      columnName
    }\` FROM \`${
      tableName
    }\` WHERE \`${
      columnName
    }\` IS NOT NULL AND \`${columnName}\` != '' LIMIT 1`,
    (error, results, fields) => {
      // console.log(error, results, fields);

      // return {error, results, fields}
      if (error) {
        reject(error);
      } else {
        // resolve([]);
        resolve(results);
      }
      con.end();
    },
  ));
}

async function countNumberofRows(connectionData: ConnectionData, tableName: string): Promise<number> {
  const con: Connection = await connect(connectionData);
  return new Promise((resolve, reject) => con.query(
    // the limit does not affect the results of larger tables,
    // but it solves a bug in Mysql where count is wrong.
    // https://stackoverflow.com/questions/20648045/why-is-mysql-is-giving-an-incorrect-count-for-a-simple-query
    `SELECT COUNT(*) as count FROM \`${tableName}\` LIMIT 0 , 100`,
    (error, results, fields) => {
      // console.log(error, results, fields);

      // return {error, results, fields}
      if (error) {
        reject(error);
      } else {
        // resolve(results[0]['count']);
        resolve(results[0].count);
      }
      con.end();
    },
  ));
}

async function countUniqueRows(connectionData: ConnectionData, tableName: string, columns: ColumnStructure[]): Promise<number> {
  const con: Connection = await connect(connectionData);

  // calculate column String
  let columnString = '(';
  for (let j = 0; j < columns.length - 1; j++) {
    columnString += `${columns[j].columnName}), (`;
  }
  columnString += `${columns[columns.length - 1].columnName})`;
  // columnString += `${columns[0].columnName}`;

  // console.log(columnString);

  return new Promise((resolve, reject) => con.query(
    // DISTINCT can't be used since it is has bugs in multiple
    // versions of Mysql where it returns a slightly incorrect value.
    `SELECT COUNT(*) as count FROM ( SELECT ${columnString} FROM \`${tableName}\` GROUP BY ${columnString} ) as sub`,
    (error, results, fields) => {
      // console.log(error, results, fields);

      // return {error, results, fields}
      if (error) {
        reject(error);
      } else {
        resolve(results[0].count);
        // resolve(0);
      }
      con.end();
    },
  ));
}

async function testIfValuesInColumnExistInOtherTable(connectionData: ConnectionData, candidateTable: string, candidateColumn: string, foreignTable: string, foreignColumn: string): Promise<boolean> {
  const con: Connection = await connect(connectionData);

  // const correct = await new Promise((resolve, reject) => con.query(
  //   // DISTINCT can't be used since it is has bugs in multiple versions of
  //   // // Mysql where it returns a slightly incorrect value.
  //   `IF EXISTS ( SELECT \`${
  //     foreignColumn
  //   }\` FROM \`${
  //     foreignTable
  //   }\` WHERE \`${
  //     foreignColumn
  //   }\` IS NOT NULL EXCEPT SELECT "${
  //     candidateColumn
  //   }" FROM \`${
  //     candidateTable
  //   }\` ) Then SELECT "exists" as res; ELSE SELECT "no does not exist" as res; END IF`,
  //   // `SELECT \`${foreignColumn}\` FROM \`${foreignTable}\` WHERE NOT EXISTS(
  //   //   SELECT "${candidateColumn}" FROM \`${candidateTable}\`
  //   // ) `,
  //   (error, results, fields) => {
  //     // console.log(error, results, fields);
  //     // console.log('old exists: ', results[0][0].res === 'exists');

  //     // console.log(correct);

  //     // reject('Some error');

  //     // return {error, results, fields}
  //     if (error) {
  //       reject(error);
  //     } else {
  //       // console.log(results[0][0]);

  //       // resolve(results[0][0].res === 'exists');
  //       resolve(results.length > 0);
  //       // resolve(0);
  //     }
  //     con.end();
  //   },
  // ));

  // con = await connect(connectionData);

  const queryString = `SELECT \`${
    foreignColumn
  }\` FROM \`${
    foreignTable
  }\` WHERE \`${
    foreignColumn
  }\` IS NOT NULL AND \`${
    foreignColumn
  }\` NOT IN (SELECT \`${
    candidateColumn
  }\` FROM \`${
    candidateTable
  }\`) `;

  return new Promise((resolve, reject) => con.query(
    // DISTINCT can't be used since it is has bugs in multiple versions of
    // // Mysql where it returns a slightly incorrect value.
    queryString,
    // `SELECT IF (SELECT \`${foreignColumn}\` FROM \`${foreignTable}\` WHERE NOT EXISTS(
    //   SELECT "${candidateColumn}" FROM \`${candidateTable}\`
    // ), "exists", "Not exists") `,
    // `SELECT *
    // FROM \`${candidateTable}\` TB
    // LEFT JOIN \`${foreignTable}\` TA
    // ON TB.\`${candidateColumn}\`=TA.\`${foreignColumn}\`
    // WHERE TA.\`${foreignColumn}\` IS NULL LIMIT 1`,
    (error, results, fields) => {
      // console.log(error, results, fields);
      // console.log(correct);

      // reject('Some error');

      // return {error, results, fields}
      if (error) {
        console.log(queryString);

        reject(error);
      } else {
        if (results.length <= 0) {
          console.log(`all values of ${foreignTable}.${foreignColumn} does not exist in ${candidateTable}.${candidateColumn}`);
        }
        // console.log('new exists: ', results.length > 0);

        // resolve(results[0][0].res === 'exists');
        resolve(results.length <= 0);
        // resolve(0);
      }
      con.end();
    },
  ));
}

async function testIfForeignKey(connectionData: ConnectionData, candidateTable: string, candidateColumns: ColumnStructure[], foreignTable: string, foreignColumns: ColumnStructure[]): Promise<boolean> {
  const con: Connection = await connect(connectionData);

  const queryString = `SELECT ${
    getSQLColumnsFromList(foreignColumns, '`')
  } FROM \`${
    foreignTable
  }\` WHERE (${
    getSQLColumnsFromList(foreignColumns, '`')
  }) NOT IN (SELECT ${
    getSQLColumnsFromList(candidateColumns, '`')
  } FROM \`${
    candidateTable
  }\`) `;

  return new Promise((resolve, reject) => con.query(
    // DISTINCT can't be used since it is has bugs in multiple versions of
    // Mysql where it returns a slightly incorrect value.
    // `IF NOT EXISTS \n( SELECT\n ${
    //   getSQLColumnsFromList(foreignColumns, '`')
    // } FROM \`${
    //   foreignTable
    // }\` WHERE\n ${
    //   getSQLNotNULLFromList(foreignColumns, '`')
    // } \nEXCEPT SELECT ${
    //   getSQLColumnsFromList(candidateColumns, '`')
    // } FROM \`${
    //   candidateTable
    // }\` ) \n THEN SELECT 'exists' as res; ELSE SELECT 'not' as res; END IF`,
    queryString,
    (error, results, fields) => {
      // console.log(error, results, fields);

      // return {error, results, fields}
      if (error) {
        console.log(queryString);

        reject(error);
      } else {
        // console.log(results[0]);

        // resolve(results[0][0].res === 'exists');
        resolve(results.length <= 0);
        // resolve(0);
      }
      con.end();
    },
  ));
}

export default {
  connect,
  fetchAllTables,
  fetchColumns,
  fetchData,
  fetchPrimaryKeys,
  fetchForeignKeys,
  checkIfColumnIsNull,
  countNumberofRows,
  countUniqueRows,
  testIfValuesInColumnExistInOtherTable,
  testIfForeignKey,
};

// starting foreign key search on table:  film
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "title" FKTable:  film_text , FKColumns:  "title"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  film_category , FKColumns:  "film_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  inventory , FKColumns:  "film_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  film_actor , FKColumns:  "film_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  film_text , FKColumns:  "film_id"

// starting foreign key search on table:  film
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "title" FKTable:  address , FKColumns:  "address2"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  actor , FKColumns:  "actor_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  address , FKColumns:  "address_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  address , FKColumns:  "city_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  city , FKColumns:  "city_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  customer , FKColumns:  "customer_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  customer , FKColumns:  "store_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  customer , FKColumns:  "address_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  film_actor , FKColumns:  "actor_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  film_actor , FKColumns:  "film_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  film_category , FKColumns:  "film_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  inventory , FKColumns:  "film_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  inventory , FKColumns:  "store_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  MULTI_F2 , FKColumns:  "ColA"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  MULTI_F2 , FKColumns:  "ColB"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  payment , FKColumns:  "customer_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  rental , FKColumns:  "customer_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  staff , FKColumns:  "address_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  staff , FKColumns:  "store_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  store , FKColumns:  "store_id"
// Table.ts:403 Foreign key found. PKTable:  film , PKColumns:  "film_id" FKTable:  store , FKColumns:  "address_id"
