const mssql = window.require("mssql");

export function getSQLColumnsFromList(array) {
  var columns = '"';
  for (var j = 0; j < array.length - 1; j++) {
    columns += array[j].columnName + '",\n "';
  }
  columns += array[array.length - 1].columnName + '"';
  return columns;
}

export function getSQLNotNULLFromList(array) {
  var columns = '"';
  for (var j = 0; j < array.length - 1; j++) {
    columns += array[j].columnName + '" IS NOT NULL AND\n "';
  }
  columns += array[array.length - 1].columnName + '" IS NOT NULL';
  return columns;
}

export async function executeSQLQuery(query, depth = 0) {
  try {
    // await mssql.connect(this.store.connection.databaseConfig);
    // create Request object
    var request = new mssql.Request();
    const result = await request.query(query);
    // console.log(result, query);
    return result;
  } catch (e) {
    console.log(query);
    console.log(e);
    if (e.name === "ConnectionError" && depth < 4) {
      console.log("trying again");
      return await executeSQLQuery(query, depth + 1);
    }
  }
}
