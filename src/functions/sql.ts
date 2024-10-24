import { ColumnStructure } from '../database/structures';

const mssql = window.require('mssql');

export function getSQLColumnsFromList(array: ColumnStructure[], divider = '"') {
  let columns = divider;
  for (let j = 0; j < array.length - 1; j++) {
    columns += `${array[j].columnName}${divider},\n ${divider}`;
  }
  columns += `${array[array.length - 1].columnName}${divider}`;
  return columns;
}

export function getSQLNotNULLFromList(array: ColumnStructure[], divider = '"') {
  let columns = divider;
  for (let j = 0; j < array.length - 1; j++) {
    columns += `${array[j].columnName}${divider} IS NOT NULL AND\n ${divider}`;
  }
  columns += `${array[array.length - 1].columnName}${divider} IS NOT NULL`;
  return columns;
}

export async function executeSQLQuery(query: string, depth: number = 0): Promise<any> {
  try {
    // create Request object
    const request = new mssql.Request();
    const result = await request.query(query);
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
