import React, { Component } from "react";
import { Link } from "react-router-dom";
import { observable } from "mobx";
import { observer, inject } from "mobx-react";
import "../App.css";
import "./database.css";
import "./verification.css";
import VerifyTable from "../components/verifyTable";
import Table from "../components/table";

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
  @observable poppupColumns = [];

  @observable popupTable = undefined;

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

  openPopup(tableName) {
    console.log(tableName);
    this.popupTable = tableName;
    this.poppupColumns = [];
  }

  selectForeignKey(key) {
    if (!key.table) {
      this.popupTable = key.pkTable;
      this.poppupColumns = key.pkColumn;
    } else {
      this.popupTable = key.table;
      this.poppupColumns = key.pointingOnColumn;
    }
  }

  renderPopup() {
    if (
      !this.popupTable ||
      !this.props.selectedStore.connection.databaseStructure.saveDataLoaded
    ) {
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
          <p>{this.popupTable}</p>
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
    const connection = this.props.selectedStore.connection;

    // list tables that should be verified.
    let id = 0;

    return (
      <div className="DatabaseScreen">
        <div className="TopMenu">
          <Link to="/database/">Back</Link>
          <p>
            {connection ? connection.server + " : " + connection.database : ""}
          </p>
        </div>
        <h3>Tables which are too small to be relevant</h3>
        {connection.databaseStructure.tablesToVerify
          .filter(item => {
            return item.type !== "island" && item.type !== "single";
          })
          .map(item => {
            return (
              <VerifyTable
                key={id++}
                tables={item.tables}
                reason={item.reason}
                previewTable={name => this.openPopup(name)}
              />
            );
          })}
        <h3>Tables with no connections</h3>
        {connection.databaseStructure.tablesToVerify
          .filter(item => {
            return item.type === "single";
          })
          .map((item, i) => {
            return (
              <VerifyTable
                key={id++}
                tables={item.tables}
                reason={item.reason}
                previewTable={name => this.openPopup(name)}
              />
            );
          })}
        <h3>Tables with no relevant connections making them useless</h3>
        {connection.databaseStructure.tablesToVerify
          .filter(item => {
            return item.type === "island";
          })
          .map((item, i) => {
            return (
              <VerifyTable
                key={id++}
                tables={item.tables}
                reason={item.reason}
                previewTable={name => this.openPopup(name)}
              />
            );
          })}
        {this.renderPopup()}
      </div>
    );
  }
}

export default TableVerificationScreen;
