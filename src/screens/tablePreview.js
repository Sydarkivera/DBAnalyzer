import React, { Component } from "react";
import { Link } from "react-router-dom";
import { observer, inject } from "mobx-react";
import { observable, toJS } from "mobx";
import "../App.css";
import "./tablePreview.css";
import Table from "../components/table";

const mssql = window.require("mssql");

@inject("selectedStore")
@observer
class TablePreviewScreen extends Component {
  @observable data = [];
  @observable structure = [];

  @observable start = 0;
  @observable interval = 30;

  @observable popupTable = undefined;
  @observable poppupColumns = [];
  // @observable end = 30;

  allowData = true;

  // constructor(props) {
  // super(props);
  // props.selectedStore.connection.databaseStructure.fetchAllTables();
  // setTimeout(() => this.getInitialData(), 1000);
  // }

  async findCandidateKeys() {
    console.log("starting candidate search");
    this.props.selectedStore.table.candidateKeys = [];
    await this.props.selectedStore.table.findCandidateKeys();
    console.log("done");
  }

  async findForeignKeys() {
    // let selectedTable = this.props.selectedStore.table;
    let allTables = this.props.selectedStore.connection.databaseStructure
      .tables;
    await this.props.selectedStore.table.findForeignKeys(allTables);
  }

  getSQLColumnsFromList(array) {
    var columns = '"';
    for (var j = 0; j < array.length - 1; j++) {
      columns += array[j].columnName + '", "';
    }
    columns += array[array.length - 1].columnName + '"';
    return columns;
  }

  async executeSQLQuery(query, depth = 0) {
    try {
      await mssql.connect(this.props.selectedStore.connection.databaseConfig);
      // create Request object
      var request = new mssql.Request();
      const result = await request.query(query);
      return result;
    } catch (e) {
      console.log(query);
      console.log(e);
      if (e.name === "ConnectionError" && depth < 0) {
        return await this.executeSQLQuery(query, depth + 1);
      }
    }
  }

  displayNextRows = () => {
    this.start += this.interval;
    this.getInitialData();
  };

  selectForeignKey(key) {
    // display popup with new table. Or let the table
    if (!key.table) {
      this.popupTable = key.pkTable;
      this.poppupColumns = key.pkColumn;
    } else {
      this.popupTable = key.table;
      this.poppupColumns = key.pointingOnColumn;
    }
  }

  renderPopup() {
    if (!this.popupTable) {
      return null;
    } else {
      return (
        <div className="popup">
          <p
            onClick={() => {
              this.popupTable = undefined;
            }}
          >
            Close
          </p>
          <Table
            table={this.props.selectedStore.connection.databaseStructure.findTable(
              this.popupTable
            )}
            highlightColumns={this.poppupColumns}
            selectForeignKey={key => this.selectForeignKey(key)}
          />
        </div>
      );
    }
  }

  render() {
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

    return (
      <div className="DatabaseScreen">
        <div className="TopMenu">
          <Link to="/database/">Back</Link>
          {/* <p onClick={this.goBack}>Back</p> */}
          <p>
            {this.props.selectedStore.connection
              ? this.props.selectedStore.connection.server
              : ""}{" "}
            :{" "}
            {this.props.selectedStore.table
              ? this.props.selectedStore.table.tableName
              : ""}
          </p>
        </div>
        <p onClick={() => this.findCandidateKeys()}>Find candidate keys</p>
        <p onClick={() => this.findForeignKeys()}>Find foreign keys</p>
        <Table
          table={this.props.selectedStore.table}
          selectForeignKey={key => this.selectForeignKey(key)}
        />
        {this.renderPopup()}
      </div>
    );
  }
}

export default TablePreviewScreen;
