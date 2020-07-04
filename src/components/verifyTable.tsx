import React, { Component } from 'react';
import ShouldSaveButton from './shouldSaveButton';
// import { observable } from "mobx";
// import "./table.css";
import './verifyTable.css';
import TableStore from 'src/store/Table';
// import { Selected } from "../store/selected";

// const mssql = window.require("mssql");

interface PropType {
  // selectedStore?: Selected,
  // selected: SelectedStore
  previewTable: Function,
  // tables: any[],
  item: any,
  tables: TableStore[]
  // reason: string
}

// @inject("selectedStore")
// @observer
class VerifyTable extends Component<PropType> {
  constructor(props: PropType) {
    super(props);
    // this.props.selectedStore.connection.databaseStructure.fetchAllTables();
    console.log('ctor');
  }

  saveToggle(tableName: string) {
    // var table = this.props.selected.connection.struture.findTable(
    //   tableName
    // );
    // table.shouldSave = 0;
    // if (table.shouldSave === 0) {
    //   table.shouldSave = 1;
    // }
  }

  previewTable(item: any) {
    if (this.props.previewTable) {
      this.props.previewTable(item);
    } else {
      console.log('Table pressed: ', item);
    }
  }

  render() {
    const { item, tables } = this.props;
    // if (!this.props.selectd.connection.databaseStructure.saveDataLoaded) {
    //   return null;
    // }
    return (
      <div className="verifyTableRow">
        <div key={0}>
          {item.tables
            ? item.tables.map((tableName: string) => {
              // console.log(
              //   this.props.selectedStore.connection.databaseStructure.findTable(
              //     item
              //   )
              // );
              // return null;
              // console.log(tableName);

              const table = tables.find((t) => t.tableName === tableName);
              if (!table) {
                return null;
              }
              console.log(table.shouldSave);

              return (
                <div className="tableRow" key={tableName}>
                  <p
                    onClick={() => {
                      this.previewTable(item);
                    }}
                  >
                    {tableName}
                  </p>
                  <ShouldSaveButton
                    shouldSave={table.shouldSave}
                    onChange={(val: any) => (table.shouldSave = val)}
                  />
                </div>
              );
              // return null;
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
