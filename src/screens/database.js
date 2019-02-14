import React, { Component } from "react";
import { Link } from "react-router-dom";
import { observable } from "mobx";
import { observer, inject } from "mobx-react";
import "../App.css";
import style from "./database.css";

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

    this.state = {
      loading: true,
      numEmptyTables: 0,
      tables: []
    };

    props.selectedStore.connection.fetchDatabaseStrucutre();

    // mssql.on("error", err => {
    // ... error handler
    // });
    // console.log(style);
    // setTimeout(() => this.getInitialData(), 1000);
  }

  getInitialData = async () => {
    try {
      await mssql.connect(this.props.selectedStore.connection.databaseConfig);
      // create Request object
      var request = new mssql.Request();
      const result = await request.query(
        "SELECT SCHEMA_NAME(schema_id) AS [SchemaName],[Tables].name AS [TableName],SUM([Partitions].[rows]) AS [TotalRowCount]FROM sys.tables AS [Tables] JOIN sys.partitions AS [Partitions]ON [Tables].[object_id] = [Partitions].[object_id] AND [Partitions].index_id IN ( 0, 1 ) GROUP BY SCHEMA_NAME(schema_id), [Tables].name;"
      );
      console.log(result);
      var emptyCount = 0;
      var totalRows = 0;
      for (var i in result) {
        // console.log(result[i]);
        let table = result[i];
        if (table["TotalRowCount"] === "0") {
          // console.log(table);
          emptyCount += 1;
        }
        totalRows += parseInt(table["TotalRowCount"], 10);
      }
      this.tables = result;
      this.numberOfEmptyTables = emptyCount;
      this.totalRows = totalRows;
      this.loading = false;
      // this.setState({
      //   loading: false,
      //   tables: result,
      //   numEmptyTables: emptyCount,
      //   totalRows: totalRows
      // });
      // console.log("Number of empty tables: ", emptyCount);
      // console.log("total rows: ", totalRows);
    } catch (err) {
      console.log(err);
    }
  };

  selectTable(tableName) {
    console.log("select table:", tableName);
    this.props.selectedStore.table = tableName;
    this.props.history.push("/database/table/");
    console.log("push history");
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
          tableItems.push(
            <div
              key={i}
              className="table-item"
              onClick={() => this.selectTable(table.tableName)}
            >
              <p>{table.tableName}</p>
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
