import React, { Component } from "react";
import "../App.css";

const mssql = window.require("mssql");
// const sql = window.require("mssql");

const config = {
  user: "PMO",
  password: "PMO",
  server: "10.170.70.8\\SQLEXPRESS",
  database: "PMOmasterSHV",
  port: "1433"
};

class DatabaseScreen extends Component {
  constructor() {
    super();

    this.state = {
      loading: true,
      numEmptyTables: 0,
      tables: []
    };
    mssql.on("error", err => {
      // ... error handler
    });
    mssql.connect(config);
    setTimeout(() => this.getInitialData(), 1000);
  }

  getInitialData = async () => {
    try {
      // console.log(mssql);

      // mssql.connect(
      //   config,
      //   function(err) {
      //     if (err) console.log(err);

      // create Request object
      var request = new mssql.Request();

      // query to the database and get the records
      // request.query(
      //   "SELECT * FROM PMOmasterSHV.INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'",
      //   function(err, recordset) {
      //     if (err) console.log(err);
      //
      //     // send records as a response
      //     // res.send(recordset);
      //     console.log(recordset);
      //   }
      // );
      const result = await request.query(
        "SELECT SCHEMA_NAME(schema_id) AS [SchemaName],[Tables].name AS [TableName],SUM([Partitions].[rows]) AS [TotalRowCount]FROM sys.tables AS [Tables] JOIN sys.partitions AS [Partitions]ON [Tables].[object_id] = [Partitions].[object_id] AND [Partitions].index_id IN ( 0, 1 ) GROUP BY SCHEMA_NAME(schema_id), [Tables].name;"
      );
      console.log(result[0]);
      var emptyCount = 0;
      for (var i in result) {
        // console.log(result[i]);
        let table = result[i];
        if (table["TotalRowCount"] === 0) {
          // console.log(table);
          emptyCount += 1;
        }
      }
      this.setState({
        loading: false,
        tables: result,
        numEmptyTables: emptyCount
      });
      console.log("Number of empty tables: ", emptyCount);
      //   }
      // );
      // let value = "i";
      // await mssql.connect(config);
      // const result = await mssql.query`select * from mytable where id = ${value}`;
      // console.log(mssql);
      // list all tables:
      // console.log(pool);
      // let result = await mssql.query(
      //   "SELECT TABLE_NAME FROM PMOmasterSHV.INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
      // );
      // console.dir(result);
      // console.log("result", result);
      // await mssql.connect("mssql://POM:POM@10.170.70.12/SQLEXPRESS");
      // await mssql.connect(
      //   "Driver=Tedious;Server=10.170.70.8\\SQLEXPRESS;Database=PMOmasterSHV;UID=PMO;PWD=PMO;trusted=true;"
      // );
    } catch (err) {
      console.log(err);
    }

    // try {
    //   console.log("sql connecting......");
    //   let pool = await sql.connect(config);
    //   let result = await pool.request().query("select * from Subject"); // subject is my database table name
    //
    //   console.log(result);
    // } catch (err) {
    //   console.log(err);
    // }
  };

  render() {
    const { loading, tables, numEmptyTables } = this.state;

    var loadingLabel = null;
    if (loading) {
      loadingLabel = <p>Loading, please wait</p>;
    } else {
      loadingLabel = (
        <div>
          <p>Non empty tables: {tables.length - numEmptyTables}</p>
          <p>Number of empty tables: {numEmptyTables}</p>
        </div>
      );
    }

    var allTables = null;
    if (!loading) {
      var tableItems = [];
      var tablesSorted = tables.sort((a, b) => {
        if (parseInt(a.TotalRowCount) > parseInt(b.TotalRowCount)) {
          return -1;
        }
        return 1;
      });
      for (var i in tablesSorted) {
        let table = tablesSorted[i];
        // console.log(tables[i].TotalRowCount > 0);
        if (parseInt(table.TotalRowCount) > 0) {
          tableItems.push(
            <div key={i} className="tableRow">
              <p>{table.TableName}</p>
              <p>rows: {table.TotalRowCount}</p>
            </div>
          );
        }
      }
      allTables = <div>{tableItems}</div>;
    }

    return (
      <div className="DatabaseScreen">
        <header className="App-header">
          {loadingLabel}
          {allTables}
        </header>
      </div>
    );
  }
}

export default DatabaseScreen;
