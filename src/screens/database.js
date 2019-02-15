import React, { Component } from "react";
import { Link } from "react-router-dom";
import { observable } from "mobx";
import { observer, inject } from "mobx-react";
import "../App.css";
import style from "./database.css";

import { FaRegCircle, FaRegCheckCircle } from "react-icons/fa";

const mssql = window.require("mssql");
// const sql = window.require("mssql");

// const config = {
//   user: "PMO",
//   password: "PMO",
//   server: "10.170.70.8\\SQLEXPRESS",
//   database: "PMOmasterSHV",
//   port: "1433"
// };

@inject("selectedStore")
@observer
class DatabaseScreen extends Component {
  @observable tables = [];
  @observable numberOfEmptyTables = 0;
  @observable totalRows = 0;
  @observable loading = true;

  constructor(props) {
    super(props);

    props.selectedStore.connection.fetchDatabaseStrucutre();
  }

  selectTable(table) {
    // console.log("select table:", tableName);
    this.props.selectedStore.table = table;
    this.props.history.push("/database/table/");
    // console.log("push history");
  }

  render() {
    // const { loading, tables, numberOfEmptyTables, totalRows } = this;
    const connection = this.props.selectedStore.connection;

    var loadingLabel = null;
    var allTables = null;
    console.log(connection);
    if (!connection.databaseStructure || connection.databaseStructure.loading) {
      loadingLabel = <p>Loading, please wait</p>;
    } else {
      loadingLabel = (
        <div>
          <p>
            Non empty tables:{" "}
            {connection.databaseStructure.tables.length -
              connection.databaseStructure.numberOfEmptyTables}
          </p>
          <p>
            Number of empty tables:{" "}
            {connection.databaseStructure.numberOfEmptyTables}
          </p>
          <p>
            Total number of rows:{" "}
            {connection.databaseStructure.numberOfRowsInTables}
          </p>
        </div>
      );

      var tableItems = [];
      var tablesSorted = connection.databaseStructure.tables
        .slice()
        .sort((a, b) => {
          if (a.rowCount > b.rowCount) {
            return -1;
          }
          return 1;
        });
      // console.log(tablesSorted);
      for (var i in tablesSorted) {
        let table = tablesSorted[i];
        // console.log(tables[i].TotalRowCount > 0);
        if (table.rowCount > 0) {
          let checked = table.shouldSave ? (
            <FaRegCheckCircle
              onClick={() => (table.shouldSave = !table.shouldSave)}
            />
          ) : (
            <FaRegCircle
              onClick={() => (table.shouldSave = !table.shouldSave)}
            />
          );
          tableItems.push(
            <div key={i} className="table-item">
              <div className="table-item-name">
                {checked}
                <p onClick={() => this.selectTable(table)}>{table.tableName}</p>
              </div>
              <p>rows: {table.rowCount}</p>
            </div>
          );
        }
      }
      allTables = <div className="table-list">{tableItems}</div>;
    }

    // if (!loading) {
    //
    // }
    // console.log(this.props.selectedStore.connection);
    return (
      <div className="DatabaseScreen">
        <div className="TopMenu">
          <Link to="/">Back</Link>
          {/* <p onClick={this.goBack}>Back</p> */}
          <p>
            {this.props.selectedStore.connection
              ? this.props.selectedStore.connection.server
              : ""}
          </p>
        </div>
        {/* <header className="App-header"> */}
        {loadingLabel}
        {allTables}
        {/* </header> */}
      </div>
    );
  }
}

export default DatabaseScreen;
