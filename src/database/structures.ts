export class ConnectionData {
  server: string = ''

  database: string = ''

  username: string = ''

  password: string = ''

  port: number = 0

  dbms: string = ''

  label: string = ''
}

export class ForeignKeyColumn {
    pkColumn: string = ''

    fkColumn: string = ''
}

export class ForeignKeyStructure {
  fkTable: string = ''

  pkTable: string = ''

  columns: ForeignKeyColumn[] = []
}

export class ColumnStructure {
  columnName: string = ''

  dataType: string = ''

  primaryKey: boolean = false

  foreignKeys: ForeignKeyStructure[] = []

  isNull: boolean = false
}
