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
    await this.loadViews();
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

  render() {
    // const { loading, tables, numberOfEmptyTables, totalRows } = this;
    const connection = this.props.selectedStore.connection;
    const structure = connection.databaseStructure;
    const step = structure.step;
    // var numberOfTables = structure.numberOfNonEmptyTables;
    // console.log(numberOfTables);
    // var b = structure.numberOfEmptyTables;
    // numberOfTables -= b;
    // structure.tables.length - structure.numberOfEmptyTables;

    var loadingLabel = null;
    var allTables = null;
    // console.log(connection);
    if (!connection.databaseStructure || connection.databaseStructure.loading) {
      loadingLabel = <p>Loading, please wait</p>;
    } else {
      loadingLabel = (
        <div>
          <p>
            Planned workflow: 1. load an initial analysis of the database. This
            includes finding all relations and finding the tables likely to be
            saved and likely to be removed. 2. Present the result to the user
            and let the user approve it. 3. Present the cornercases for the user
            and let the user make decisions based on it. 4. Present the final
            content and let the user decide what to do with it.
          </p>
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
          <p onClick={() => this.loadForeignKeys()}>
            Load all foreign keys {this.foreignProgress}
          </p>
        </div>
      );

      var s = 1;
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
          <p onClick={() => this.startAnalysis(0, false)}>
            Start analysis {step}
          </p>
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

      var tableItems = [];
      var tablesSorted = this.tables.slice().sort((a, b) => {
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
