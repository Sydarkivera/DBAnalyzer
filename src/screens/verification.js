import React, { Component } from "react";
import { Link } from "react-router-dom";
import { observable } from "mobx";
import { observer, inject } from "mobx-react";
import "../App.css";
import "./database.css";

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

    props.selectedStore.connection.fetchDatabaseStrucutre();

    setTimeout(() => {
      this.loadAllData();
    }, 10);
  }

  async loadAllData() {
    await this.loadTables();
  }

  async loadTables() {
    this.tables = await this.props.selectedStore.connection.databaseStructure.fetchAllTables();
    this.loadingTables = false;
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
