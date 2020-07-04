import { ColumnStructure } from '../database/structures';

const mssql = window.require('mssql');

export function getSQLColumnsFromList(array: ColumnStructure[]) {
  let columns = '"';
  for (let j = 0; j < array.length - 1; j++) {
    columns += `${array[j].columnName}",\n "`;
  }
  columns += `${array[array.length - 1].columnName}"`;
  return columns;
}

export function getSQLNotNULLFromList(array: ColumnStructure[]) {
  let columns = '"';
  for (let j = 0; j < array.length - 1; j++) {
    columns += `${array[j].columnName}" IS NOT NULL AND\n "`;
  }
  columns += `${array[array.length - 1].columnName}" IS NOT NULL`;
  return columns;
}

export async function executeSQLQuery(query: string, depth: number = 0): Promise<any> {
  try {
    // await mssql.connect(this.store.connection.databaseConfig);
    // create Request object
    const request = new mssql.Request();
    const result = await request.query(query);
    // console.log(result, query);
    return result;
  } catch (e) {
    console.log(query);
    console.log(e);
    if (e.name === 'ConnectionError' && depth < 4) {
      console.log('trying again');
      return executeSQLQuery(query, depth + 1);
    }
    return null;
  }
}
