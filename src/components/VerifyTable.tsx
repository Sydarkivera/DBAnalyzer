import React, { Component } from 'react';
import { observer } from 'mobx-react';
import TableStore from 'src/store/Table';
import ShouldSaveButton from './ShouldSaveButton';
import './VerifyTable.css';

interface PropType {
  previewTable: Function,
  item: any,
  tables: TableStore[]
}

@observer
class VerifyTable extends Component<PropType> {
  constructor(props: PropType) {
    super(props);
    console.log('ctor');
  }

  previewTable(item: any) {
    const { previewTable } = this.props;
    if (previewTable) {
      previewTable(item);
    } else {
      console.log('Table pressed: ', item);
    }
  }

  render() {
    const { item, tables } = this.props;
    return (
      <div className="verifyTableRow">
        <div key={0}>
          {item.tables
            ? item.tables.map((tableName: string) => {
              const table = tables.find((t) => t.tableName === tableName);
              if (!table) {
                return null;
              }
              return (
                <div className="tableRow" key={tableName}>
                  <p
                    onClick={() => {
                      this.previewTable(tableName);
                    }}
                  >
                    {tableName}
                  </p>
                  <ShouldSaveButton
                    shouldSave={table.shouldSave}
                    onChange={(val: any) => { table.shouldSave = val; }}
                  />
                </div>
              );
            })
            : ''}
        </div>
        <p key={1}>{item.reason}</p>
        {item.tables.map((item: any, i:number) => <p key={2 + i} />)}
      </div>
    );
  }
}

export default VerifyTable;
