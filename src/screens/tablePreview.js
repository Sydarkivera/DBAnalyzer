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

  @observable start = 0;
  @observable interval = 30;
  // @observable end = 30;

  allowData = true;

  constructor() {
    super();
    setTimeout(() => this.getInitialData(), 1000);
  }

  getInitialData = async () => {
    try {
      // create Request object

      await this.props.selectedStore.table.loadColumnData();

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
      if (this.allowData) {
        await mssql.connect(this.props.selectedStore.connection.databaseConfig);
        var request = new mssql.Request();
        const result = await request.query(
          "SELECT * FROM " +
            this.props.selectedStore.table.tableName +
            " ORDER BY " +
            this.props.selectedStore.table.columns[0].columnName +
            " OFFSET " +
            this.start +
            " ROWS FETCH NEXT " +
            this.interval +
            " ROWS ONLY;"
        );
        const structure = this.props.selectedStore.table.columns;
        let stringTypes = ["int", "smallint", "char", "varchar", "text"];
        for (var i in result) {
          var row = result[i];
          var tempData = [];
          for (var index in structure) {
            let type = structure[index].dataType;
            if (stringTypes.includes(type)) {
              tempData.push(row[structure[index].columnName]);
            } else if (type === "datetime") {
              var d = new Date(row[structure[index].columnName]);

              tempData.push(d.toDateString());
            } else if (type === "bit") {
              tempData.push("binary");
            } else {
              tempData.push("unknown type: " + type);
            }
          }
          data.push(tempData);
        }
      }

      // console.log(data);
      this.data = data;
    } catch (err) {
      console.log(err);
    }
  };

  displayNextRows = () => {
    this.start += this.interval;
    this.getInitialData();
  };

  renderData() {
    const structure = this.props.selectedStore.table.columns;
    // console.log(structure);
    if (!structure) {
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
    if (this.data.length > 0) {
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
      }
    } else {
      data = (
        <tr className="preview-table-row">
          <td className="preview-table-item" colSpan={headerItems.length}>
            {this.allowData
              ? "Loading data"
              : "Permission denied for presentation"}
          </td>
        </tr>
      );
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
            :{" "}
            {this.props.selectedStore.table
              ? this.props.selectedStore.table.tableName
              : ""}
          </p>
        </div>
        <p>
          Displaying {this.start}-{this.start + this.interval} of{" "}
          {this.props.selectedStore.table.rowCount}
        </p>
        {this.renderData()}
        <p onClick={this.displayNextRows}>Next rows</p>
      </div>
    );
  }
}

export default TablePreviewScreen;
