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
class TableVerificationScreen extends Component {
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
    const connection = this.props.selectedStore.connection;

    // list tables that should be verified.

    return (
      <div className="DatabaseScreen">
        <div className="TopMenu">
          <Link to="/database/">Back</Link>
          <p>
            {connection ? connection.server + " : " + connection.database : ""}
          </p>
        </div>
        <h3>Tables which are too small to be relevant</h3>
        <p>
          {connection.databaseStructure.tablesToVerify
            .filter(item => {
              return item.type !== "island";
            })
            .map(item => {
              return (
                (item.tables ? item.tables : item.tableName) +
                ": " +
                item.reason
              );
            })}
        </p>
        <h3>Tables with no relevant connections making them useless</h3>
        {connection.databaseStructure.tablesToVerify
          .filter(item => {
            return item.type === "island";
          })
          .map((item, i) => {
            return <p key={i}>{item.tables + ": " + item.reason}</p>;
          })}
      </div>
    );
  }
}

export default TableVerificationScreen;
