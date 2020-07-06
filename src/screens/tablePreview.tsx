import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import { observable } from 'mobx';
import '../App.css';
import SelectedStore from '../store/Selected';
import TableComponent from '../components/table';

interface PropsType {
  // children: JSX.Element
  // name: string
  // connectionStore: ConnectionList,
  selected: SelectedStore,
  history: any,
  // history: History<LocationState>
}

@inject('selected')
@observer
class TablePreviewScreen extends Component<PropsType> {
  @observable data: any[] = [];

  @observable structure: any[] = [];

  @observable start = 0;

  @observable interval = 30;

  @observable popupTable: any = undefined;

  @observable poppupColumns: any[] = [];
  // @observable end = 30;

  allowData = true;

  constructor(props: PropsType) {
    super(props);

    if (props.selected.table) {
      props.selected.table.fetchColumns().then(() => {
      });
    }

    // props.selectedStore.connection.databaseStructure.fetchAllTables();
    // setTimeout(() => this.getInitialData(), 1000);
  }

  // async findCandidateKeys() {
  //   console.log("starting candidate search");
  //   this.props.selectedStore.table.candidateKeys = [];
  //   await this.props.selectedStore.table.findCandidateKeys();
  //   console.log("done");
  // }

  // async findForeignKeys() {
  //   // let selectedTable = this.props.selectedStore.table;
  //   let allTables = this.props.selectedStore.connection.databaseStructure
  //     .tables;
  //   await this.props.selectedStore.table.findForeignKeys(allTables);
  // }

  // getSQLColumnsFromList(array: any[]) {
  //   var columns = '"';
  //   for (var j = 0; j < array.length - 1; j++) {
  //     columns += array[j].columnName + '", "';
  //   }
  //   columns += array[array.length - 1].columnName + '"';
  //   return columns;
  // }

  // async executeSQLQuery(query: string, depth = 0): Promise<any> {
  //   try {
  //     await mssql.connect(this.props.selectedStore.connection.databaseConfig);
  //     // create Request object
  //     var request = new mssql.Request();
  //     const result = await request.query(query);
  //     return result;
  //   } catch (e) {
  //     console.log(query);
  //     console.log(e);
  //     if (e.name === "ConnectionError" && depth < 0) {
  //       return await this.executeSQLQuery(query, depth + 1);
  //     }
  //   }
  // }

  // displayNextRows = () => {
  //   this.start += this.interval;
  //   // this.getInitialData();
  // };

  // selectForeignKey(key: any) {
  //   const { selected } = this.props;
  //   console.log(key);

  //   // display popup with new table. Or let the table
  //   if (!key.table) {
  //     this.popupTable = key.pkTable;
  //     this.poppupColumns = key.pkColumn;
  //   } else {
  //     this.popupTable = key.table;
  //     this.poppupColumns = key.pointingOnColumn;
  //   }
  // }

  // renderPopup() {
  //   if (!this.popupTable) {
  //     return null;
  //   } else {
  //     return (
  //       <div className="popup">
  //         <p
  //           onClick={() => {
  //             this.popupTable = undefined;
  //           }}
  //         >
  //           Close
  //         </p>
  //         <p>{this.popupTable}</p>
  //         <TableComponent
  //           table={this.props.selectedStore.connection.databaseStructure.findTable(
  //             this.popupTable
  //           )}
  //           highlightColumns={this.poppupColumns}
  //           selectForeignKey={(key: any) => this.selectForeignKey(key)}
  //         />
  //       </div>
  //     );
  //   }
  // }

  render() {
    const { selected } = this.props;
    // console.log(this.props.selectedStore.table.foreignKeys);

    // sort out all foreign keys linking to this.
    // console.log(this.props.selectedStore.connection.databaseStructure.tables);
    // this.props.selectedStore.connection.databaseStructure.tables.filter(
    //   item => {
    //     // console.log(item);
    //     if (item.foreignKeys) {
    //       var keys = item.foreignKeys.filter(fkey => {
    //         return fkey.pkTable === this.props.selectedStore.table.tableName;
    //       });
    //       if (keys.length > 0) {
    //         console.log(
    //           keys.map(a => {
    //             return (
    //               a.pkTable +
    //               ": " +
    //               a.pkColumn.map(pk => {
    //                 return pk.columnName;
    //               })
    //             );
    //           }),
    //           item.tableName
    //         );
    //       }
    //     }
    //     return true;
    //   }
    // );

    // console.log(selected.table);

    return (
      <div className="DatabaseScreen">
        <nav className="navbar is-fixed-top" aria-label="main navigation">
          <div className="navbar-brand">
            <div className="navbar-item">
              <Link
                className="button is-primary"
                type="button"
                to="/database/"
              >
                <strong>Back</strong>
              </Link>
            </div>
          </div>
          <div className="navbar-start">
            <h2 className="navbar-item">
              {selected.connection
                ? selected.connection.cLabel
                : ''}
              {' '}
              :
              {' '}
              {selected.table
                ? selected.table.tableName
                : ''}
            </h2>
          </div>
        </nav>
        <div className="section">
          <TableComponent
            table={selected.table}
            structure={selected.connection.struture}
            // selectForeignKey={(key: any) => this.selectForeignKey(key)}
          />
        </div>
        {/* {this.renderPopup()} */}
      </div>
    );
  }
}

export default TablePreviewScreen;
