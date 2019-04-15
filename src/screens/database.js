import React, { Component } from "react";
import { Link } from "react-router-dom";
import { observable } from "mobx";
import { observer, inject } from "mobx-react";
import "../App.css";
import "./database.css";
import { testLikness } from "../functions/permutations";

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

  async startAnalysis(start = 0) {
    var structure = this.props.selectedStore.connection.databaseStructure;
    // .completedStep = 0;
    // this.step = 0;
    structure.completedStep = 0;
    var a = 0;
    const tables = this.tables;
    // this.step += 1;
    // this.props.selectedStore.connection.databaseStructure.completedStep += 1;
    // this.props.selectedStore.connection.databaseStructure.completedStep = this.step;
    structure.completedStep += 1;
    if (start <= a++) {
      this.tableStructureLoaded = 0;
      for (let key in tables) {
        let table = tables[key];
        if (table.rowCount > 0) {
          await table.loadColumnData();
          this.tableStructureLoaded += 1;
        }
      }
    }
    structure.completedStep += 1;
    // this.props.selectedStore.connection.databaseStructure.completedStep += 2;
    return;
    // this.step += 1;
    // this.props.selectedStore.connection.databaseStructure.completedStep = this.step;
    if (start <= a++) {
      this.columnsCheckedFoNull = 0;
      for (let key in tables) {
        let table = tables[key];
        if (table.rowCount > 0) {
          await table.loadNullColumns();
          this.columnsCheckedFoNull += 1;
        }
      }
    }
    this.step += 1;
    this.props.selectedStore.connection.databaseStructure.completedStep = this.step;
    if (start <= a++) {
      this.tableCandidateKeysLoaded = 0;
      for (let key in tables) {
        let table = tables[key];
        if (table.rowCount > 0) {
          await table.findCandidateKeys();
          this.tableCandidateKeysLoaded += 1;
        }
      }
    }
    this.step += 1;
    this.props.selectedStore.connection.databaseStructure.completedStep = this.step;
    if (start <= a++) {
      this.tableForeignKeysLoaded = 0;
      for (let key in tables) {
        let table = tables[key];
        if (table.rowCount > 0) {
          await table.findForeignKeys(tables);
          this.tableForeignKeysLoaded += 1;
        }
      }
    }
    this.step += 1;
    this.props.selectedStore.connection.databaseStructure.completedStep = this.step;
    if (start <= a++) {
      this.numberOfTablesWithOneColumn = 0;
      for (let key in tables) {
        let table = tables[key];
        if (table.rowCount > 0) {
          if (table.columns.length <= 1) {
            this.numberOfTablesWithOneColumn += 1;
            table.shouldSave = false;
          }
          // await table.findForeignKeys();
          // this.numberOfTablesWithOneColumn += 1;
        }
      }
    }
    this.step += 1;
    this.props.selectedStore.connection.databaseStructure.completedStep = this.step;
    if (start <= a++) {
      // find all tables with no references of foreign keys
      let emptyTables = [];
      let pointedOnNames = new Set();
      for (let key in tables) {
        let table = tables[key];
        if (table.rowCount > 0) {
          if (table.foreignKeys.length === 0) {
            emptyTables.push(table);
          } else {
            for (let i = 0; i < table.foreignKeys.length; i++) {
              pointedOnNames.add(table.foreignKeys[i].pkTable);
            }
          }
        }
      }
      console.log(emptyTables.length);
      let res = [];
      for (let emptyKey in emptyTables) {
        let emptyTable = emptyTables[emptyKey];
        if (!pointedOnNames.has(emptyTable.tableName)) {
          res.push(emptyTable);
          emptyTable.shouldSave = false;
        }
      }
      console.log(
        "emptyTables",
        res.map(item => {
          return item.tableName;
        })
      );

      // find disjoint sets.

      let t;
      let validTables = [];
      for (let i = 0; i < tables.length; i++) {
        if (tables[i].rowCount > 1 && tables[i].shouldSave === true) {
          validTables.push(tables[i]);
        }
      }
      while (validTables.length > 0) {
        t = validTables[0];
        let firstSet = new Set();
        firstSet.add(t.tableName);
        // console.log(t);
        this.checkSet(firstSet, t, tables);
        console.log("found set: ", firstSet);
        // console.log(newSet);
        // let r = [];
        validTables = validTables.filter(item => {
          return !firstSet.has(item.tableName);
        });
        // for (let i = 0; i < tables.length; i++) {
        //   if (tables[i].rowCount > 1 && tables[i].shouldSave === true) {
        //     if (!firstSet.has(tables[i].tableName)) {
        //       r.push(tables[i].tableName);
        //     }
        //   }
        // }
        // console.log();
      }
    }
    this.step += 1;
    this.props.selectedStore.connection.databaseStructure.completedStep = this.step;
  }

  checkSet(existing, t, tables) {
    const liknessThreshold = 0.8;
    // console.log(t);
    // console.log(t.tableName);
    let newSet = new Set();
    for (let i = 0; i < t.foreignKeys.length; i++) {
      // add referenced table.
      // firstSet.add(t.foreignKeys[i].pkTable);
      // console.log(t.foreignKeys[i]);
      // return;
      if (
        testLikness(
          t.foreignKeys[i].pkColumn.map(item => {
            return item.columnName;
          }),
          t.foreignKeys[i].pointingOnColumn.map(item => {
            return item.columnName;
          })
        ) > liknessThreshold
      ) {
        if (!existing.has(t.foreignKeys[i].pkTable)) {
          existing.add(t.foreignKeys[i].pkTable);
          newSet.add(
            tables.find(item => {
              return t.foreignKeys[i].pkTable === item.tableName;
            })
          );
        }
      }
    }
    for (let i = 0; i < tables.length; i++) {
      if (tables[i].foreignKeys && tables[i].shouldSave === true) {
        for (let j = 0; j < tables[i].foreignKeys.length; j++) {
          if (tables[i].foreignKeys[j].pkTable === t.tableName) {
            if (
              testLikness(
                tables[i].foreignKeys[j].pkColumn.map(item => {
                  return item.columnName;
                }),
                tables[i].foreignKeys[j].pointingOnColumn.map(item => {
                  return item.columnName;
                })
              ) > liknessThreshold
            ) {
              if (!existing.has(tables[i].tableName)) {
                existing.add(tables[i].tableName);
                newSet.add(tables[i]);
              }
            }
          }
        }
      }
    }

    newSet.forEach(item => {
      this.checkSet(existing, item, tables);
    }, this);

    // for (let i = 0; i < newSet.size; i++) {
    //   this.checkSet(existing, newSet[i], tables);
    // }
    // console.log(existing);
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
    const step = connection.databaseStructure.completedStep;

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
          <p onClick={() => this.startAnalysis(0)}>
            Start analysis{" "}
            {
              this.props.selectedStore.connection.databaseStructure
                .completedStep
            }
          </p>
          {step >= s++ ? (
            <p>
              Tables Structure Analysed: {this.tableStructureLoaded}/{connection
                .databaseStructure.tables.length -
                connection.databaseStructure.numberOfEmptyTables}
            </p>
          ) : (
            ""
          )}
          {step >= s++ ? (
            <p>
              Tables null checks: {this.columnsCheckedFoNull}/{connection
                .databaseStructure.tables.length -
                connection.databaseStructure.numberOfEmptyTables}
            </p>
          ) : (
            ""
          )}
          {step >= s++ ? (
            <p>
              Loaded candidatekeys: {this.tableCandidateKeysLoaded}/{connection
                .databaseStructure.tables.length -
                connection.databaseStructure.numberOfEmptyTables}
            </p>
          ) : (
            ""
          )}
          {step >= s++ ? (
            <p>
              Loaded foreign keys: {this.tableForeignKeysLoaded}/{connection
                .databaseStructure.tables.length -
                connection.databaseStructure.numberOfEmptyTables}
            </p>
          ) : (
            ""
          )}
          {step >= s++ ? (
            <p>Tables with one column: {this.numberOfTablesWithOneColumn}</p>
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
