export class ConnectionData {
  server = ''

  database = ''

  username = ''

  password = ''

  port = 0

  dbms = ''

  label = ''
}

export class ForeignKeyColumn {
    pkColumn = ''

    fkColumn = ''
}

export class ForeignKeyStructure {
  fkTable = ''

  pkTable = ''

  columns: ForeignKeyColumn[] = []
}

export class ColumnStructure {
  columnName = ''

  dataType = ''

  primaryKey = false

  foreignKeys: ForeignKeyStructure[] = []

  isNull = false
}
