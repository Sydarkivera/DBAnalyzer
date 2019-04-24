import React, { Component } from "react";
import { observer, inject } from "mobx-react";
// import { observable } from "mobx";
// import "./table.css";
import "./verifyTable.css";
import { FaRegCircle, FaRegCheckCircle } from "react-icons/fa";

// const mssql = window.require("mssql");

@inject("selectedStore")
@observer
class VerifyTable extends Component {
  constructor() {
    super();
    // this.props.selectedStore.connection.databaseStructure.fetchAllTables();
    console.log("ctor");
  }

  saveToggle(tableName) {
    var table = this.props.selectedStore.connection.databaseStructure.findTable(
      tableName
    );
    table.shouldSave = !table.shouldSave;
  }

  previewTable(item) {
    if (this.props.previewTable) {
      this.props.previewTable(item);
    } else {
      console.log("Table pressed: ", item);
    }
  }

  render() {
    if (!this.props.selectedStore.connection.databaseStructure.saveDataLoaded) {
      return null;
    }
    return (
      <div className="verifyTableRow">
        <div key={0}>
          {this.props.tables
            ? this.props.tables.map((item, i) => {
                // console.log(
                //   this.props.selectedStore.connection.databaseStructure.findTable(
                //     item
                //   )
                // );
                // return null;
                return (
                  <div className="tableRow" key={i}>
                    <p
                      onClick={() => {
                        this.previewTable(item);
                      }}
                    >
                      {item}
                    </p>
                    {this.props.selectedStore.connection.databaseStructure.findTable(
                      item
                    ).shouldSave ? (
                      <FaRegCheckCircle onClick={() => this.saveToggle(item)} />
                    ) : (
                      <FaRegCircle onClick={() => this.saveToggle(item)} />
                    )}
                  </div>
                );
              })
            : ""}
        </div>
        <p key={1}>{this.props.reason}</p>
        {this.props.tables.map((item, i) => {
          return <p key={2 + i} />;
        })}
      </div>
    );
  }
}

export default VerifyTable;
