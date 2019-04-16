import React, { Component } from "react";
import { Link } from "react-router-dom";
import { observer, inject } from "mobx-react";
import { observable, toJS } from "mobx";
import "../App.css";
import "./tablePreview.css";

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

      // await this.props.selectedStore.table.loadColumnData();

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
          'SELECT * FROM "' +
            this.props.selectedStore.table.tableName +
            '" ORDER BY ' +
            this.props.selectedStore.table.columns[0].columnName +
            " OFFSET " +
            this.start +
            " ROWS FETCH NEXT " +
            this.interval +
            " ROWS ONLY;"
        );
        const structure = this.props.selectedStore.table.columns;
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

  async findCandidateKeys() {
    console.log("starting candidate search");
    this.props.selectedStore.table.candidateKeys = [];
    await this.props.selectedStore.table.findCandidateKeys();
    console.log("done");
  }

  async findForeignKeys() {
    // let selectedTable = this.props.selectedStore.table;
    let allTables = this.props.selectedStore.connection.databaseStructure
      .tables;
    await this.props.selectedStore.table.findForeignKeys(allTables);
  }

  getSQLColumnsFromList(array) {
    var columns = '"';
    for (var j = 0; j < array.length - 1; j++) {
      columns += array[j].columnName + '", "';
    }
    columns += array[array.length - 1].columnName + '"';
    return columns;
  }

  async executeSQLQuery(query, depth = 0) {
    try {
      await mssql.connect(this.props.selectedStore.connection.databaseConfig);
      // create Request object
      var request = new mssql.Request();
      const result = await request.query(query);
      return result;
    } catch (e) {
      console.log(query);
      console.log(e);
      if (e.name === "ConnectionError" && depth < 0) {
        return await this.executeSQLQuery(query, depth + 1);
      }
    }
  }

  displayNextRows = () => {
    this.start += this.interval;
    this.getInitialData();
  };

  renderData() {
    if (!this.props.selectedStore.table) {
      return null;
    }
    const structure = this.props.selectedStore.table.columns;
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
      console.log(toJS(this.props.selectedStore.table.candidateKeys));
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
    // console.log(this.props.selectedStore.table.foreignKeys);

    // sort out all foreign keys linking to this.
    // console.log(this.props.selectedStore.connection.databaseStructure.tables);
    this.props.selectedStore.connection.databaseStructure.tables.filter(
      item => {
        // console.log(item);
        if (item.foreignKeys) {
          var keys = item.foreignKeys.filter(fkey => {
            return fkey.pkTable === this.props.selectedStore.table.tableName;
          });
          if (keys.length > 0) {
            console.log(
              keys.map(a => {
                return (
                  a.pkTable +
                  ": " +
                  a.pkColumn.map(pk => {
                    return pk.columnName;
                  })
                );
              }),
              item.tableName
            );
          }
        }
        return true;
      }
    );

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
          Displaying {this.start}-{Math.min(
            this.start + this.interval,
            this.props.selectedStore.table.rowCount
          )}{" "}
          of{" "}
          {this.props.selectedStore.table
            ? this.props.selectedStore.table.rowCount
            : ""}
        </p>
        <p onClick={() => this.findCandidateKeys()}>Find candidate keys</p>
        <p onClick={() => this.findForeignKeys()}>Find foreign keys</p>
        <p>
          Found Candidate_keys:{" "}
          {this.props.selectedStore.table.candidateKeys
            .reduce((accumulator, item) => {
              // console.log(item.length, accumulator);
              return (
                accumulator +
                "[" +
                item
                  .reduce((accumulator, i) => {
                    // console.log(i);
                    return accumulator + "'" + i.columnName + "', ";
                  }, "")
                  .slice(0, -2) +
                "], "
              );
            }, "")
            .slice(0, -2)}
        </p>
        <p>
          Found Foreign_keys:{" "}
          {this.props.selectedStore.table.foreignKeys
            ? this.props.selectedStore.table.foreignKeys
                .reduce((accumulator, item) => {
                  // console.log(item, accumulator);
                  return (
                    accumulator +
                    "{pkTable: " +
                    item.pkTable +
                    ", pkColumns: [" +
                    item.pkColumn
                      .reduce((accumulator, i) => {
                        // console.log(i);
                        return accumulator + "'" + i.columnName + "', ";
                      }, "")
                      .slice(0, -2) +
                    "], sourceColumn: [" +
                    item.pointingOnColumn
                      .reduce((accumulator, i) => {
                        // console.log(i);
                        return accumulator + "'" + i.columnName + "', ";
                      }, "")
                      .slice(0, -2) +
                    "]}, "
                  );
                }, "")
                .slice(0, -2)
            : ""}
        </p>
        {this.renderData()}
        <p onClick={this.displayNextRows}>Next rows</p>
      </div>
    );
  }
}

export default TablePreviewScreen;
