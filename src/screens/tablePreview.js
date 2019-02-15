import React, { Component } from "react";
import { Link } from "react-router-dom";
import { observer, inject } from "mobx-react";
import { observable } from "mobx";
import "../App.css";
import style from "./tablePreview.css";

const mssql = window.require("mssql");

@inject("selectedStore")
@observer
class TablePreviewScreen extends Component {
  @observable data = [];
  @observable structure = [];

  constructor() {
    super();
    setTimeout(() => this.getInitialData(), 1000);
  }

  getInitialData = async () => {
    try {
      await mssql.connect(this.props.selectedStore.connection.databaseConfig);
      // create Request object
      var request = new mssql.Request();
      const result = await request.query(
        "SELECT TOP(10) * FROM " + this.props.selectedStore.table
      );
      console.log(result);

      // var request2 = new mssql.Request();
      // const result2 = await request2.query(
      //   "SELECT * FROM INFORMATION_SCHEMA.COLUMNS where TABLE_NAME='" +
      //     this.props.selectedStore.table +
      //     "'"
      // );
      // console.log(result2);
      //
      // // var res = {}
      // this.strucutre = [];
      var data = [];
      // for (var index in result2) {
      //   // var tempStructure = []
      //   this.strucutre.push({
      //     columnName: result2[index]["COLUMN_NAME"],
      //     dataType: result2[index]["DATA_TYPE"]
      //   });
      // }

      const structure = this.props.selectedStore.table.columns;
      let stringTypes = ["int", "smallint", "char", "varchar", "text"];
      for (var i in result) {
        var row = result[i];
        var tempData = [];
        for (var index in structure) {
          let type = structure.dataType;
          if (stringTypes.includes(type)) {
            tempData.push(row[structure.columnName]);
          } else if (type === "datetime") {
            var d = new Date(row[structure.columnName]);

            tempData.push(d.toDateString());
          } else if (type === "bit") {
            tempData.push("binary");
          } else {
            tempData.push("unknown type: " + type);
          }
        }
        data.push(tempData);
      }
      // console.log(data);
      this.data = data;
    } catch (err) {
      console.log(err);
    }
  };

  renderData() {
    const structure = this.props.selectedStore.table.columns;
    if (this.data.length === 0) {
      return null;
    }

    var headerItems = [];
    for (let index in structure) {
      headerItems.push(
        <th className="preview-table-item" key={structure[index].columnName}>
          {structure[index].columnName}
          <br />
          {structure[index].dataType}
        </th>
      );
    }
    var data = [];
    for (let index in this.data) {
      var rowContent = [];
      for (let i in this.data[index]) {
        rowContent.push(
          <td className="preview-table-item" key={i}>
            {this.data[index][i]}
          </td>
        );
      }
      data.push(
        <tr key={index} className="preview-table-row">
          {rowContent}
        </tr>
      );
      // headerItems.push(
      //   <p key={this.strucutre[index].columnName}>
      //     {this.strucutre[index].columnName}
      //   </p>
      // );
    }

    return (
      <div className="preview-table">
        <table>
          <thead>
            <tr className="preview-table-row">{headerItems}</tr>
          </thead>
          <tbody>{data}</tbody>
        </table>
      </div>
    );
  }

  render() {
    return (
      <div className="DatabaseScreen">
        <div className="TopMenu">
          <Link to="/database/">Back</Link>
          {/* <p onClick={this.goBack}>Back</p> */}
          <p>
            {this.props.selectedStore.connection
              ? this.props.selectedStore.connection.server
              : ""}{" "}
            : {this.props.selectedStore.table}
          </p>
        </div>
        {this.renderData()}
      </div>
    );
  }
}

export default TablePreviewScreen;
