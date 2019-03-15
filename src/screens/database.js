import React, { Component } from "react";
import { Link } from "react-router-dom";
import { observable } from "mobx";
import { observer, inject } from "mobx-react";
import "../App.css";
import "./database.css";

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
  @observable candidateProgress = 0;

  constructor(props) {
    super(props);

    this.state = {
      views: []
    };

    props.selectedStore.connection.fetchDatabaseStrucutre();

    this.loadViews();
    // this.loadProcedures();
  }

  async req(query) {
    // create Request object
    var request = new mssql.Request();
    const result = await request.query(query);
    return result;
  }

  async loadProcedures() {
    let query = "SELECT * FROM sys.procedures";
    await mssql.connect(this.props.selectedStore.connection.databaseConfig);
    // create Request object
    var request = new mssql.Request();
    const result = await request.query(query);
    console.log(result);
  }

  async loadViews() {
    let query = "SELECT * FROM sys.views";
    await mssql.connect(this.props.selectedStore.connection.databaseConfig);
    // create Request object
    var request = new mssql.Request();
    const result = await request.query(query);
    // console.log(result);
    var res = [];
    for (var i = 0; i < result.length; i++) {
      let r = await this.req(
        "select m.definition from sys.sql_modules m where m.object_id = " +
          result[i]["object_id"]
      );
      // console.log(r);
      res.push({
        name: result[i].name,
        object_id: result[i].object_id,
        sql: r[0].definition
      });
    }
    this.setState({ views: res });
  }

  selectTable(table) {
    // console.log("select table:", tableName);
    this.props.selectedStore.table = table;
    this.props.history.push("/database/table/");
    // console.log("push history");
  }

  selectView(view) {
    console.log(view);
  }

  async loadCandidateKeys() {
    const tables = this.props.selectedStore.connection.databaseStructure.tables;
    // console.log(tables);
    for (let key in tables) {
      let table = tables[key];
      if (/*!table.candidateKeys && */ table.rowCount > 0) {
        await table.findCandidateKeys();
        this.candidateProgress += 1;
      }
      // break;
    }
    console.log("done");
  }

  renderViews() {
    return this.state.views.map((item, index) => {
      return (
        <div key={item.object_id}>
          <p onClick={() => this.selectView(item)}>{item.name}</p>
          <p>{item.sql}</p>
        </div>
      );
    });
  }

  render() {
    // const { loading, tables, numberOfEmptyTables, totalRows } = this;
    const connection = this.props.selectedStore.connection;

    var loadingLabel = null;
    var allTables = null;
    // console.log(connection);
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
          <p onClick={() => this.loadCandidateKeys()}>
            Load all candidate keys {this.candidateProgress}
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
              ? this.props.selectedStore.connection.server +
                " : " +
                this.props.selectedStore.connection.database
              : ""}
          </p>
        </div>
        {/* <header className="App-header"> */}
        {loadingLabel}
        {allTables}
        <h3>Views</h3>
        {this.renderViews()}
        {/* </header> */}
      </div>
    );
  }
}

export default DatabaseScreen;
