/* eslint-disable class-methods-use-this */
import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import './table.css';
import ShouldSaveButton from './shouldSaveButton';
import TableStore from '../store/Table';
import DatabaseStructureStore from '../store/DatabaseStructure';
import { ForeignKeyStructure, ForeignKeyColumn, ColumnStructure } from '../database/structures';

interface PropsType {
  // table?: Table,
  // selectedStore?: Selected,
  selectForeignKey?: Function,
  highlightColumns?: ForeignKeyColumn[],
  table?: TableStore,
  structure: DatabaseStructureStore
}

interface StateType {
  views: any[]
}

// @inject("selectedStore")
@observer
class TableComponent extends Component<PropsType> {
  @observable data: any[][] = [];

  @observable structure: any[] = [];

  @observable start = 0;

  @observable interval = 30;

  @observable numberOfRows = 0;

  @observable displayNullColumns = false;

  @observable highlight: ForeignKeyColumn[] = [];
  // @observable end = 30;

  allowData = true;

  constructor(props: PropsType) {
    super(props);
    setTimeout(() => this.getInitialData(), 1000);
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps: PropsType) {
    const { table } = this.props;
    if (!nextProps.table) {
      this.data = [];
      return;
    }
    if ((table ? table.tableName : '') !== nextProps.table.tableName) {
      this.data = [];
      setTimeout(() => this.getInitialData(), 1000);
      this.highlight = [];
    }
  }

  getInitialData = async () => {
    const { table } = this.props;
    if (!table) {
      return;
    }
    await table.fetchData(this.start, this.start + this.interval); // initial 10
    // try {
    //   await this.props.table.loadColumnData();
    //   this.numberOfRows = this.props.table.rowCount;

    const data = [];

    //   if (this.allowData) {
    //     await mssql.connect(this.props.selectedStore.connection.databaseConfig);
    //     var request = new mssql.Request();
    //     const result = await request.query(
    //       'SELECT * FROM "' +
    //         this.props.table.tableName +
    //         '" ORDER BY ' +
    //         this.props.table.columns[0].columnName +
    //         " OFFSET " +
    //         this.start +
    //         " ROWS FETCH NEXT " +
    //         this.interval +
    //         " ROWS ONLY;"
    //     );
    const { columns } = table;
    const stringTypes = [
      'int',
      'smallint',
      'char',
      'varchar',
      'text',
      'numeric',
      'tinyint',
      'nvarchar',
      'money',
      'real',
      'xml',
      'decimal',
      'timestamp',
      'mediumint',
      'enum',
      'set',
    ];
    for (const i in table.data) {
      const row = table.data[i];
      const tempData = [];
      for (const index in columns) {
        const type = columns[index].dataType;
        if (stringTypes.includes(type)) {
          tempData.push(`'${row[columns[index].columnName]}'`);
        } else if (type === 'datetime') {
          const d = new Date(row[columns[index].columnName]);

          tempData.push(d.toDateString());
        } else if (type === 'bit') {
          if (row[columns[index].columnName].length > 10) {
            tempData.push('binary');
          } else {
            let s = '';
            for (const si in row[columns[index].columnName]) {
              s += row[columns[index].columnName][si];
            }
            tempData.push(`'${s}'`);
          }
        } else if (type === 'varbinary') {
          // tempData.push(
          //   this.stringToBinary(row[structure[index].columnName], false)
          // );
          tempData.push(row[columns[index].columnName]);
        } else {
          tempData.push(`unknown type: ${type}`);
        }
      }
      data.push(tempData);
    }
    //   }

    //   // console.log(data);
    this.data = data;
    //   if (
    //     !this.props.selectedStore.connection.databaseStructure.saveDataLoaded
    //   ) {
    //     this.props.selectedStore.connection.databaseStructure.fetchAllTables();
    //   }
    // } catch (err) {
    //   console.log(err);
    // }
    // await this.findCandidateKeys();
  };

  displayNextRows = () => {
    this.start += this.interval;
    this.data = [];
    this.getInitialData();
  };

  displayPrevRows = () => {
    this.start -= this.interval;
    if (this.start < 0) {
      this.start = 0;
    }
    this.data = [];
    this.getInitialData();
  };

  selectForeignKey(item: any) {
    const { selectForeignKey } = this.props;
    if (selectForeignKey) {
      selectForeignKey(item);
    } else {
      // console.log(item.pkTable, item.table);
    }
  }

  highlightColumns = (columnName: string) => {
    const { highlightColumns } = this.props;
    if (this.highlight && this.highlight.length > 0) {
      if (
        this.highlight.find((item) => item.pkColumn === columnName)
      ) {
        return 'highlight-other';
      }
    }
    if (highlightColumns) {
      if (
        highlightColumns.find((item) => item.pkColumn === columnName)
      ) {
        return 'highlight';
      }
    }

    return '';
  };

  enterFK = (item: ForeignKeyStructure) => {
    this.highlight = item.columns;
  };

  leaveFK = () => {
    this.highlight = [];
  };

  getKeysPointingOnThisTable() {
    const { structure, table } = this.props;
    if (!table) return null;
    const initialData: ForeignKeyStructure[] = [];
    return structure.tables.reduce(
      (reducer, t) => {
        const keys = t.foreignKeys.filter((item) => item.pkTable === table.tableName);
        // console.log(keys);
        if (keys.length > 0) {
          return [
            ...reducer,
            ...keys.map((item) => ({ ...item })),
          ];
        }

        return reducer;
      },
      initialData,
    );
  }

  renderForeignKeysPointingOnThisTable() {
    const linkingTables = this.getKeysPointingOnThisTable();
    if (!linkingTables) return null;
    // console.log(linkingTables);

    return (
      <p>
        {'ForeignKeys: '}
        {linkingTables.map((item) => (
          <span
            key={item.fkTable}
            onMouseEnter={() => this.enterFK(item)}
            onMouseLeave={() => this.leaveFK()}
            onClick={() => this.selectForeignKey(item)}
          >
            {item.fkTable}
            {', '}
          </span>
        ))}
      </p>
    );
    // }
    // return null;
  }

  renderFKForColumn(column: ColumnStructure) {
    let fkString = '';
    let fkCount = 0;
    if (column.foreignKeys.length > 0) {
      // console.log('has foreign keys');

      fkCount = 0;
      fkString = 'Foreign Keys:\n';
      for (let i = 0; i < column.foreignKeys.length; i++) {
        const key = column.foreignKeys[i];
        const pkColumn = key.columns.find((item) => item.fkColumn === column.columnName);
        if (pkColumn) {
          fkString += `${key.pkTable} -> ${pkColumn.pkColumn}\n`;
          fkCount += 1;
        }
      }
    }
    if (fkCount === 0) {
      return null;
    }

    return <span style={{ color: 'purple' }} data-tooltip={fkString}>{`${fkCount} FK`}</span>;
  }

  renderCKForColumn(column: ColumnStructure) {
    const linkingTables = this.getKeysPointingOnThisTable();
    if (!linkingTables) return null;

    let ckString = 'Pointing on this:\n';
    let ckCount = 0;
    linkingTables.map((item) => {
      const fkColumn = item.columns.find((i) => i.pkColumn === column.columnName);
      if (fkColumn) {
        ckString += `${item.fkTable} -> ${fkColumn.fkColumn}\n`;
        ckCount += 1;
      }
    });
    if (ckCount === 0) {
      return null;
    }

    return <span style={{ color: 'purple' }} data-tooltip={ckString}>{`${ckCount} CK`}</span>;
  }

  renderData() {
    const { table } = this.props;
    if (!table) {
      return (<p />);
    }
    const { columns } = table;
    // console.log(structure);
    if (!columns) {
      return null;
    }

    const headerItems: any[] = [];
    for (const index in columns) {
      const column = columns[index];

      if (this.displayNullColumns || !column.isNull) {
        headerItems.push(
          <th
            className={
              `preview-table-item ${this.highlightColumns(column.columnName)}`
            }
            key={column.columnName}
          >
            <p style={{ fontSize: '1.1em' }}>{column.columnName}</p>
            <p style={{ fontSize: '1em', fontWeight: 'normal' }}>
              {column.primaryKey ? (
                <span style={{ color: 'orange' }} data-tooltip="Primary Key">(PK)</span>
              ) : null}
              {' '}
              {this.renderFKForColumn(column)}
              {' '}
              {this.renderCKForColumn(column)}
              {' '}
              {column.dataType}
            </p>

            {/* {fk && fk.length > 1 ? fk : null} */}
          </th>,
        );
      }
    }

    // return null;
    let data: any;
    if (this.data.length > 0) {
      data = [];
      for (const index in this.data) {
        const rowContent = [];
        for (const i in this.data[index]) {
          const struct = columns[i];
          // if (!struct) {
          //   console.log(struct);
          //   console.log(columns);
          //   console.log(this.data[index]);
          // }

          if (this.displayNullColumns || !struct.isNull) {
            rowContent.push(
              <td className="preview-table-item" key={i}>
                {this.data[index][i]}
              </td>,
            );
          }
        }
        data.push(
          <tr key={index} className="preview-table-row">
            {rowContent}
          </tr>,
        );
      }
    } else if (table.rowCount <= this.start) {
      // no data available
      data = (
        <p>
          No data available
        </p>
      );
    } else {
      data = (
        <tr className="preview-table-row">
          <td className="preview-table-item" colSpan={headerItems.length}>
            {this.allowData
              ? 'Loading data...'
              : 'Permission denied for presentation'}
          </td>
        </tr>
      );
    }

    return (
      <div className="table-container" style={{ overflowY: 'visible' }}>

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <ShouldSaveButton
            style={{ alignSelf: 'center', fontSize: '2em', marginRight: 10 }}
            shouldSave={table.shouldSave}
            onChange={(val:any) => { table.shouldSave = val; }}
          />
          <h1 style={{ fontSize: '2em' }}>

            {table.tableName}

          </h1>
        </div>
        <div className="alignRow">
          {this.start > 0 ? (
            <p className="right" onClick={this.displayPrevRows}>
              Prev rows
            </p>
          ) : (
            <p />
          )}
          <p>
            Display null columns:
            {' '}
            <input
              name="isGoing"
              type="checkbox"
              checked={this.displayNullColumns}
              onChange={(val) => {
                this.displayNullColumns = val.target.checked;
                // console.log(this.displayNullColumns);
              }}
            />
          </p>
          {this.start + this.interval <= table.rowCount ? (
            <p className="left" onClick={this.displayNextRows}>
              Next rows
            </p>
          ) : (
            <p />
          )}
        </div>
        <div className="table is-striped is-hoverable is-fullwidth">
          <table>
            <thead>
              <tr className="preview-table-row">{headerItems}</tr>
            </thead>
            <tbody>{data}</tbody>
          </table>
        </div>
      </div>
    );
  }

  render() {
    const { table } = this.props;
    if (!table) {
      return null;
    }
    let data = this.renderData();
    // let data = null;
    if (!data) {
      data = <p>Loading data</p>;
    }

    return (
      <div className="box">
        {data}
        <p style={{ textAlign: 'center' }}>
          Displaying
          {' '}
          {this.start}
          -
          {Math.min(this.start + this.interval, table.rowCount)}
          {' '}
          of
          {' '}
          {table ? table.rowCount : ''}
        </p>
      </div>
    );
  }
}

export default TableComponent;
