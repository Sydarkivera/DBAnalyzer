import React, { Component } from "react";
import { observer, inject } from "mobx-react";
import { observable, toJS } from "mobx";
import "./table.css";
// import "./tablePreview.css";

const mssql = window.require("mssql");

@inject("selectedStore")
@observer
class Table extends Component {
  @observable data = [];
  @observable structure = [];

  @observable start = 0;
  @observable interval = 30;
  @observable numberOfRows = 0;
  // @observable end = 30;

  allowData = true;

  constructor() {
    super();
    setTimeout(() => this.getInitialData(), 1000);
  }

  getInitialData = async () => {
    try {
      await this.props.table.loadColumnData();
      this.numberOfRows = this.props.table.rowCount;

      var data = [];

      if (this.allowData) {
        await mssql.connect(this.props.selectedStore.connection.databaseConfig);
        var request = new mssql.Request();
        const result = await request.query(
          'SELECT * FROM "' +
            this.props.table.tableName +
            '" ORDER BY ' +
            this.props.table.columns[0].columnName +
            " OFFSET " +
            this.start +
            " ROWS FETCH NEXT " +
            this.interval +
            " ROWS ONLY;"
        );
        const structure = this.props.table.columns;
        let stringTypes = [
          "int",
          "smallint",
          "char",
          "varchar",
          "text",
          "numeric",
          "tinyint",
          "nvarchar",
          "money",
          "real",
          "xml"
        ];
        for (var i in result) {
          var row = result[i];
          var tempData = [];
          for (var index in structure) {
            let type = structure[index].dataType;
            if (stringTypes.includes(type)) {
              tempData.push("'" + row[structure[index].columnName] + "'");
            } else if (type === "datetime") {
              var d = new Date(row[structure[index].columnName]);

              tempData.push(d.toDateString());
            } else if (type === "bit") {
              if (row[structure[index].columnName].length > 10) {
                tempData.push("binary");
              } else {
                var s = "";
                for (var si in row[structure[index].columnName]) {
                  s += row[structure[index].columnName][si];
                }
                tempData.push("'" + s + "'");
              }
            } else if (type === "varbinary") {
              // tempData.push(
              //   this.stringToBinary(row[structure[index].columnName], false)
              // );
              tempData.push(row[structure[index].columnName]);
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
    // await this.findCandidateKeys();
  };

  displayNextRows = () => {
    this.start += this.interval;
    this.getInitialData();
  };
  displayPrevRows = () => {
    this.start -= this.interval;
    if (this.start < 0) {
      this.start = 0;
    }
    this.getInitialData();
  };

  renderData() {
    if (!this.props.table) {
      return null;
    }
    const structure = this.props.table.columns;
    // console.log(structure);
    if (!structure) {
      return null;
    }

    var headerItems = [];
    for (let index in structure) {
      let struct = structure[index];
      let pk = null;
      if (struct.primaryKey) {
        pk = [<br key={2} />, "PK"];
      }
      let fk = null;
      if (struct.foreign_keys.length > 0) {
        fk = [
          <br key={3} />,
          struct.foreign_keys.length + " FK ",
          <br key={4} />
        ];
        for (let i in struct.foreign_keys) {
          fk.push(struct.foreign_keys[i].referenceTable);
        }
      }
      headerItems.push(
        <th className="preview-table-item" key={struct.columnName}>
          {struct.columnName}
          <br key={1} />
          {struct.dataType}
          {pk}
          {fk}
        </th>
      );
    }
    // return null;
    if (this.data.length > 0) {
      // console.log(toJS(this.props.table.candidateKeys));
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
    let data = this.renderData();
    if (!data) {
      data = <p>Loading data</p>;
    }

    return (
      <div className="table">
        <p>
          Displaying {this.start}-{Math.min(
            this.start + this.interval,
            this.props.table.rowCount
          )}{" "}
          of {this.props.table ? this.props.table.rowCount : ""}
        </p>
        <div className="alignRow">
          {this.start > 0 ? (
            <p className="right" onClick={this.displayPrevRows}>
              Prev rows
            </p>
          ) : (
            <p />
          )}
          {this.start + this.interval <= this.numberOfRows ? (
            <p className="left" onClick={this.displayNextRows}>
              Next rows
            </p>
          ) : (
            <p />
          )}
        </div>
        {data}
      </div>
    );
  }
}

export default Table;
