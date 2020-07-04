import { ConnectionData, ForeignKeyStructure, ColumnStructure } from './structures';
import { getSQLColumnsFromList, getSQLNotNULLFromList } from '../functions/sql';

const mssql = window.require('mssql');

async function connect(connectionData: ConnectionData) {
  return new Promise((resolve, reject) => {
    mssql.connect(
      {
        server: connectionData.server,
        database: connectionData.database,
        user: connectionData.username,
        password: connectionData.password,
      },
      (err: any) => {
        // var cons = this.props.connectionStore.connections;
        // con["loading"] = false;
        if (err) {
          // this.formConnectionStatus = err["name"];
          reject(err);
        } else {
          // this.formConnectionStatus = "Success";
          resolve();
        }
        // console.log(err);
        // this.setState({ connections: cons });
      },
    );
  });
}

async function fetchAllTables(connectionData: ConnectionData) {
  await connect(connectionData);
  const request = new mssql.Request();
  const result = await request.query(
    'SELECT SCHEMA_NAME(schema_id) AS [SchemaName],[Tables].name AS [TableName],SUM([Partitions].[rows]) AS [TotalRowCount]FROM sys.tables AS [Tables] JOIN sys.partitions AS [Partitions]ON [Tables].[object_id] = [Partitions].[object_id] AND [Partitions].index_id IN ( 0, 1 ) GROUP BY SCHEMA_NAME(schema_id), [Tables].name;',
  );

  return result.recordset;
}

async function fetchColumns(connectionData: ConnectionData, tableName: string) {
  await connect(connectionData);
  const request = new mssql.Request();
  const result = await request.query(
    `SELECT * FROM INFORMATION_SCHEMA.COLUMNS where TABLE_NAME='${
      tableName
    }'`,
  );
  return result.recordset;
}

async function fetchData(connectionData: ConnectionData, tableName: string, start: number, end: number, columnName: string) {
  await connect(connectionData);
  const request = new mssql.Request();
  const result = await request.query(
    `SELECT * FROM "${
      tableName
    }" ORDER BY ${
      columnName
    } OFFSET ${
      start
    } ROWS FETCH NEXT ${
      end - start
    } ROWS ONLY;`,
  );
  return result.recordset;
}

async function fetchPrimaryKeys(connectionData: ConnectionData, tableName: string): Promise<string[]> {
  await connect(connectionData);
  const request = new mssql.Request();
  const result = await request.query(
    `SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu ON tc.CONSTRAINT_NAME = ccu.Constraint_name WHERE tc.CONSTRAINT_TYPE = 'Primary Key' and tc.TABLE_NAME='${
      tableName
    }'`,
  );
  const primaryKeys = [];
  for (const index in result.recordset) {
    primaryKeys.push(result.recordset[index].COLUMN_NAME);
  }
  return primaryKeys;
}
async function fetchForeignKeys(connectionData: ConnectionData, tableName: string): Promise<ForeignKeyStructure[]> {
  await connect(connectionData);
  const request = new mssql.Request();

  const result = await request.query(
    `SELECT 
      OBJECT_NAME(foreign_keys.parent_object_id) AS [fkTable],
      foreign_keys.name AS [foreignKey],
      OBJECT_NAME(foreign_keys.referenced_object_id) AS [pkTable],
      COL_NAME(foreign_key_columns.parent_object_id, foreign_key_columns.parent_column_id) AS [fkColumn],
      COL_NAME(foreign_key_columns.referenced_object_id, foreign_key_columns.referenced_column_id) AS [pkColumn]
      FROM sys.foreign_keys AS foreign_keys
      INNER JOIN sys.foreign_key_columns AS foreign_key_columns ON foreign_keys.object_id = foreign_key_columns.constraint_object_id 
      WHERE foreign_keys.parent_object_id = OBJECT_ID('${tableName}');`,
  );

  const keys: { [id: string]: ForeignKeyStructure } = {};
  for (const row of result.recordset) {
    if (row.foreignKey in keys) {
      // add column
      keys[row.foreignKey].columns.push({
        fkColumn: row.fkColumn,
        pkColumn: row.pkColumn,
      });
    } else {
      // add key
      keys[row.foreignKey] = {
        fkTable: row.fkTable,
        pkTable: row.pkTable,
        columns: [
          {
            fkColumn: row.fkColumn,
            pkColumn: row.pkColumn,
          },
        ],

      };
    }
  }

  return Object.values(keys);
}

async function checkIfColumnIsNull(connectionData: ConnectionData, tableName: string, columnName: string): Promise<any[]> {
  await connect(connectionData);
  const request = new mssql.Request();
  return request.query(
    `SELECT TOP(1) "${
      columnName
    }" FROM [${
      tableName
    }] WHERE "${
      columnName
    }" IS NOT NULL`,
  );
}

async function countNumberofRows(connectionData: ConnectionData, tableName: string): Promise<number> {
  await connect(connectionData);
  const request = new mssql.Request();
  const result = await request.query(
    `SELECT COUNT(*) as count FROM [${tableName}]`,
  );

  return result.recordset[0].count;
}

async function countUniqueRows(connectionData: ConnectionData, tableName: string, columns: ColumnStructure[]): Promise<number> {
  await connect(connectionData);

  // calculate column String
  let columnString = '"';
  for (let j = 0; j < columns.length - 1; j++) {
    columnString += `${columns[j].columnName}", "`;
  }
  columnString += `${columns[columns.length - 1].columnName}"`;

  const request = new mssql.Request();
  const result = await request.query(
    `SELECT Count(*) as count FROM ( SELECT DISTINCT ${
      columnString
    } FROM [${
      tableName
    }]) as derived`,
  );
  return result.recordset[0].count;
}
async function testIfValuesInColumnExistInOtherTable(connectionData: ConnectionData, candidateTable: string, candidateColumn: string, foreignTable: string, foreignColumn: string): Promise<boolean> {
  await connect(connectionData);

  const request = new mssql.Request();
  const result = await request.query(
    `IF NOT EXISTS ( SELECT "${
      foreignColumn
    }" FROM [${
      foreignTable
    }] WHERE "${
      foreignColumn
    }" IS NOT NULL EXCEPT SELECT "${
      candidateColumn
    }" FROM [${
      candidateTable
    }] ) SELECT 'exists' as res ELSE SELECT 'no does not exist' as res`,
  );
  return result.recordset[0].res === 'exists';
}
async function testIfForeignKey(connectionData: ConnectionData, candidateTable: string, candidateColumns: ColumnStructure[], foreignTable: string, foreignColumns: ColumnStructure[]): Promise<boolean> {
  await connect(connectionData);

  const request = new mssql.Request();
  const result = await request.query(
    `IF NOT EXISTS \n( SELECT\n ${
      getSQLColumnsFromList(foreignColumns)
    } FROM [${
      foreignTable
    }] WHERE\n ${
      getSQLNotNULLFromList(foreignColumns)
    } \nEXCEPT SELECT ${
      getSQLColumnsFromList(candidateColumns)
    } FROM [${
      candidateTable
    }] ) \nSELECT 'exists' as res ELSE SELECT 'not' as res`,
  );
  return result.recordset[0].res === 'exists';
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
