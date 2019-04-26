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
  @observable loadingTables = true;
  @observable tables = [];
  @observable numberOfEmptyTables = 0;
  @observable totalRows = 0;
  @observable loading = true;
  @observable candidateProgress = 0;
  @observable foreignProgress = 0;

  @observable tableStructureLoaded = 0;
  @observable tableCandidateKeysLoaded = 0;
  @observable tableForeignKeysLoaded = 0;
  @observable columnsCheckedFoNull = 0;
  @observable numberOfTablesWithOneColumn = 0;
  @observable step = 0;

  @observable searchText = "";

  constructor(props) {
    super(props);

    this.state = {
      views: []
    };
    console.log("ctor");

    props.selectedStore.connection.fetchDatabaseStrucutre();

    setTimeout(() => {
      this.loadAllData();
    }, 10);
  }

  async req(query) {
    // create Request object
    var request = new mssql.Request();
    const result = await request.query(query);
    return result;
  }

  async loadAllData() {
    await this.loadTables();
    // await this.loadViews();
    // this.loadProcedures();
  }

  async loadProcedures() {
    let query = "SELECT * FROM sys.procedures";
    await mssql.connect(this.props.selectedStore.connection.databaseConfig);
    // create Request object
    var request = new mssql.Request();
    const result = await request.query(query);
    console.log(result);
  }

  async loadTables() {
    this.tables = await this.props.selectedStore.connection.databaseStructure.fetchAllTables();
    this.loadingTables = false;
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

  async loadForeignKeys() {
    const tables = this.tables;
    // console.log(tables);
    for (let key in tables) {
      let table = tables[key];
      if (/*!table.candidateKeys && */ table.rowCount > 0) {
        await table.findForeignKeys(tables);
        this.foreignProgress += 1;
      }
      // break;
    }
    console.log("done");
  }

  async analyseIslands() {
    var structure = this.props.selectedStore.connection.databaseStructure;
    structure.tablesToVerify = structure.tablesToVerify.filter(item => {
      if (item.type === "island" || item.type === "single") {
        return false;
      }
      return true;
    });
    await structure.findIslands();
  }

  markAllAsSave() {
    const tables = this.tables;
    for (let key in tables) {
      let table = tables[key];
      if (/*!table.candidateKeys && */ table.rowCount > 0) {
        table.shouldSave = true;
      }
      // break;
    }
  }

  async startAnalysis(start = 0, resume = false) {
    var structure = this.props.selectedStore.connection.databaseStructure;
    var a = 0;
    // structure.step = 0;
    if (!resume) {
      structure.step = 1;
      structure.tablesToVerify = [];
    } else {
      start = structure.step - 1;
    }
    if (start <= a++) {
      await structure.analyseTableStructures();
      structure.step += 1;
    }
    if (start <= a++) {
      await structure.findNullColumns();
      structure.step += 1;
    }
    if (start <= a++) {
      await structure.findRemovableTablesBasedOnSize();
      structure.step += 1;
    }
    if (start <= a++) {
      await structure.findCandidateKeys();
      structure.step += 1;
    }
    if (start <= a++) {
      await structure.findForeignKeys();
      structure.step += 1;
    }
    // if (start <= a++) {
    // find all tables with no references of foreign keys

    await structure.findIslands();
    structure.step += 1;
    // }
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

  renderSaveButton(table) {
    switch (table.shouldSave) {
      case 0:
        return (
          <FaRegCircle
            style={{ color: "red" }}
            onClick={() => (table.shouldSave = 1)}
          />
        );
      case 1:
        return (
          <FaRegCheckCircle
            style={{ color: "yellow" }}
            onClick={() => (table.shouldSave = 2)}
          />
        );
      case 2:
        return (
          <FaRegCheckCircle
            style={{ color: "green" }}
            onClick={() => (table.shouldSave = 0)}
          />
        );
      default:
    }
  }

  renderProgress() {
    const connection = this.props.selectedStore.connection;
    const structure = connection.databaseStructure;
    const step = structure.step;
    var s = 1;
    if (step < 7) {
      return (
        <div>
          <p onClick={() => this.startAnalysis(0, false)}>Start analysis</p>
          {step >= s++ ? (
            <p>
              Tables Structure Analysed: {structure.tableStructureLoaded}/{
                structure.numberOfNonEmptyTables
              }
            </p>
          ) : (
            ""
          )}
          {step >= s++ ? (
            <p>
              Tables null checks: {structure.columnsCheckedFoNull}/{
                structure.numberOfNonEmptyTables
              }
            </p>
          ) : (
            ""
          )}
          {step >= s++ ? (
            <p>
              Tables with one column: {structure.numberOfTablesWithOneColumn}
            </p>
          ) : (
            ""
          )}
          {step >= s++ ? (
            <p>
              Loaded candidatekeys: {structure.tableCandidateKeysLoaded}/{
                structure.numberOfNonEmptyTables
              }
            </p>
          ) : (
            ""
          )}
          {step >= s++ ? (
            <p>
              Loaded foreign keys: {structure.tableForeignKeysLoaded}/{
                structure.numberOfNonEmptyTables
              }
            </p>
          ) : (
            ""
          )}
          {step >= s++ ? <p>Done</p> : ""}
        </div>
      );
    }
  }

  render() {
    // const { loading, tables, numberOfEmptyTables, totalRows } = this;
    const connection = this.props.selectedStore.connection;
    const structure = connection.databaseStructure;
    const step = structure.step;
    var loadingLabel = null;
    var allTables = null;
    // console.log(connection);
    if (!connection.databaseStructure || connection.databaseStructure.loading) {
      loadingLabel = <p>Loading, please wait</p>;
    } else {
      loadingLabel = (
        <div>
          <p>
            Tables remaning saved:{" "}
            {structure.tables.reduce((reducer, item) => {
              if (item.shouldSave && item.rowCount > 0) {
                return reducer + 1;
              }
              return reducer;
            }, 0)}/{structure.numberOfNonEmptyTables}
          </p>
          <p>Number of empty tables: {structure.numberOfEmptyTables}</p>
          <p onClick={() => this.analyseIslands()}>Find all islands</p>
          <p onClick={() => this.markAllAsSave()}>Reset all removed</p>
          {structure.tablesToVerify.length > 0 ? (
            <p
              onClick={() => {
                this.props.history.push("/database/verification");
              }}
            >
              Verify tables{" "}
              {structure.tablesToVerify.reduce((reducer, item) => {
                return reducer + item.tables.length;
              }, 0)}
            </p>
          ) : (
            ""
          )}
          {this.renderProgress()}
          <div className="input-group">
            <input
              type="text"
              name="Search"
              required
              value={this.searchText}
              onChange={text => (this.searchText = text.target.value)}
            />
            <label className="floating-label">Search</label>
          </div>
        </div>
      );

      var tableItems = [];
      var tablesSorted = this.tables.slice().sort((a, b) => {
        if (a.rowCount > b.rowCount) {
          return -1;
        }
        return 1;
      });
      if (this.searchText !== "") {
        // console.log(this.searchText);
        // console.log(tablesSorted.map(item => item.tableName));
        tablesSorted = tablesSorted.filter(
          item =>
            item.tableName.toUpperCase().search(this.searchText.toUpperCase()) >
            -1
        );
      }
      // console.log(tablesSorted);
      for (var i in tablesSorted) {
        let table = tablesSorted[i];
        // console.log(tables[i].TotalRowCount > 0);
        if (table.rowCount > 0) {
          tableItems.push(
            <div key={i} className="table-item">
              <div className="table-item-name">
                {this.renderSaveButton(table)}
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
        {/* </header> */}
      </div>
    );
  }
}

export default DatabaseScreen;
