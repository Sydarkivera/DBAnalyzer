import React, { Component } from "react";
import { observer, inject } from "mobx-react";
import { observable } from "mobx";
import "./table.css";
import { testLikness } from "../functions/permutations";
import { FaRegCircle, FaRegCheckCircle } from "react-icons/fa";
import ShouldSaveButton from "./shouldSaveButton";
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

  @observable displayNullColumns = false;

  @observable highlight = [];
  // @observable end = 30;

  allowData = true;

  constructor() {
    super();
    setTimeout(() => this.getInitialData(), 1000);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.table.tableName !== nextProps.table.tableName) {
      this.data = [];
      setTimeout(() => this.getInitialData(), 1000);
      this.highlight = [];
    }
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
      if (
        !this.props.selectedStore.connection.databaseStructure.saveDataLoaded
      ) {
        this.props.selectedStore.connection.databaseStructure.fetchAllTables();
      }
    } catch (err) {
      console.log(err);
    }
    // await this.findCandidateKeys();
  };

  displayNextRows = () => {
    this.start += this.interval;
    this.data = [];
    this.getInitialData();
  };
  displayPrevRows = () => {
    this.start -= this.interval;
    if (this.start < 0) {
      this.start = 0;
    }
    this.data = [];
    this.getInitialData();
  };

  selectForeignKey(item) {
    if (this.props.selectForeignKey) {
      this.props.selectForeignKey(item);
    } else {
      console.log(item.pkTable, item.table);
    }
  }

  highlightColumns(columnName) {
    if (this.highlight.length > 0) {
      if (
        this.highlight.find(item => {
          return item.columnName === columnName;
        })
      ) {
        return "highlight-other";
      }
    }
    if (this.props.highlightColumns) {
      if (
        this.props.highlightColumns.find(item => {
          return item.columnName === columnName;
        })
      ) {
        return "highlight";
      }
    }

    return "";
  }

  enterFK = item => {
    this.highlight = item.pkColumn;
  };

  leaveFK = item => {
    this.highlight = [];
  };

  renderSaveButton(table) {
    if (!table) {
      return null;
    }
    switch (table.shouldSave) {
      case 0:
        return (
          <FaRegCircle
            style={{ color: "red" }}
            onClick={() => (table.shouldSave = 1)}
          />
        );
      case 1:
        return (
          <FaRegCheckCircle
            style={{ color: "yellow" }}
            onClick={() => (table.shouldSave = 2)}
          />
        );
      case 2:
        return (
          <FaRegCheckCircle
            style={{ color: "green" }}
            onClick={() => (table.shouldSave = 0)}
          />
        );
      default:
        return null;
    }
  }

  renderForeignKeysPointingOnThisTable() {
    if (this.props.selectedStore.connection.databaseStructure.saveDataLoaded) {
      // find all foreign keys pointing on this.
      var linkingTables = this.props.selectedStore.connection.databaseStructure.tables.reduce(
        (reducer, table) => {
          var keys = table.foreignKeys.filter(item => {
            return (
              this.props.table.tableName === item.pkTable &&
              testLikness(
                item.pointingOnColumn.map(item => item.columnName),
                item.pkColumn.map(item => item.columnName)
              ) > 0.8
            );
          });
          // console.log(keys);
          if (keys.length > 0) {
            return [
              ...reducer,
              ...keys.map(item => {
                return { ...item, table: table.tableName };
              })
            ];
          }
          return reducer;
        },
        []
      );
      // console.log(linkingTables.map(item => item.table));
      return (
        <p>
          {"ForeignKeys: "}
          {linkingTables.map(item => {
            return (
              <span
                key={item.table}
                onMouseEnter={() => this.enterFK(item)}
                onMouseLeave={() => this.leaveFK(item)}
                onClick={() => this.selectForeignKey(item)}
              >
                {item.table}
                {", "}
              </span>
            );
          })}
        </p>
      );
    }
    return null;
  }

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
      // let pk = null;
      // if (struct.primaryKey) {
      //   pk = [<br key={2} />, "PK"];
      // }
      let fk = null;
      if (this.props.table.foreignKeys.length > 0) {
        fk = [<p key={"header"}>This table is pointing on :</p>];
        for (let i = 0; i < this.props.table.foreignKeys.length; i++) {
          let key = this.props.table.foreignKeys[i];
          // console.log(key);
          if (
            key.pointingOnColumn.find(item => {
              return struct.columnName === item.columnName;
            }) &&
            testLikness(
              key.pointingOnColumn.map(item => item.columnName),
              key.pkColumn.map(item => item.columnName)
            ) > 0.8
          ) {
            fk.push(
              <span
                className="foreignKeys"
                onClick={() => this.selectForeignKey(key)}
                key={i}
              >
                {key.pkTable}
                {", "}
              </span>
            );
          }
          // fk.push(<p>FK: {key.pkTable}</p>);
        }
      }
      // if (struct.foreign_keys.length > 0) {
      //   fk = [
      //     <br key={3} />,
      //     struct.foreign_keys.length + " FK ",
      //     <br key={4} />
      //   ];
      //   for (let i in struct.foreign_keys) {
      //     fk.push(struct.foreign_keys[i].referenceTable);
      //   }
      // }
      // console.log(struct);
      // console.log(struct.isNull);
      if (this.displayNullColumns || !struct.isNull) {
        headerItems.push(
          <th
            className={
              "preview-table-item " + this.highlightColumns(struct.columnName)
            }
            key={struct.columnName}
          >
            {struct.columnName}
            <br key={1} />
            {struct.dataType}
            {fk && fk.length > 1 ? fk : null}
          </th>
        );
      }
    }
    // return null;
    if (this.data.length > 0) {
      var data = [];
      for (let index in this.data) {
        var rowContent = [];
        for (let i in this.data[index]) {
          let struct = structure[i];
          if (!struct) {
            console.log(struct);
            console.log(structure);
            console.log(this.data[index]);
          }

          if (this.displayNullColumns || !struct.isNull) {
            rowContent.push(
              <td className="preview-table-item" key={i}>
                {this.data[index][i]}
              </td>
            );
          }
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
          Displaying {this.start}-
          {Math.min(this.start + this.interval, this.props.table.rowCount)} of{" "}
          {this.props.table ? this.props.table.rowCount : ""}
        </p>
        <ShouldSaveButton
          shouldSave={this.props.table.shouldSave}
          onChange={val => (this.props.table.shouldSave = val)}
        />
        {this.renderForeignKeysPointingOnThisTable()}

        <div className="alignRow">
          {this.start > 0 ? (
            <p className="right" onClick={this.displayPrevRows}>
              Prev rows
            </p>
          ) : (
            <p />
          )}
          <p>
            Display null columns:{" "}
            <input
              name="isGoing"
              type="checkbox"
              checked={this.displayNullColumns}
              onChange={val => {
                this.displayNullColumns = val.target.checked;
                // console.log(this.displayNullColumns);
              }}
            />
          </p>
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
