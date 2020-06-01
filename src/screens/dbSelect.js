import React, { Component } from "react";
import { observable } from "mobx";
import { observer, inject } from "mobx-react";
import "../App.css";
import "./dbSelect.css";

import {connect} from '../database/index'

const mssql = window.require("mssql");
var mysql = window.require('mysql');
// const sql = window.require("mssql");

var odbc = require('odbc')();

odbc.open("SERVER=localhost;UID=aa;PWD=aa;DATABASE=first", function (err) {
	if (err) {
		return console.log(err);
	}

	//we now have an open connection to the database
});

@inject("connectionStore", "selectedStore")
@observer
class DBSelectScreen extends Component {
  @observable showAddForm = false;

  @observable serverName = "127.0.0.1";
  @observable database = "first";
  @observable username = "aa";
  @observable password = "aa";

  @observable formConnectionStatus = "";

  testFormConnection = async () => {
    console.log(this.serverName);
    console.log(this.database);
    console.log(this.username);
    console.log(this.password);
    this.formConnectionStatus = "";


    connect({serverName: this.serverName, username: this.username, password: this.password, database: this.database}, 'mysql')
    .then((con) => {
      this.formConnectionStatus = "Success";
    }).catch((err) => {
      this.formConnectionStatus = err["name"];
    });
  };

  createFormConnection = event => {
    var conn = this.props.connectionStore.createConnection();
    conn.server = this.serverName;
    conn.database = this.database;
    conn.username = this.username;
    conn.password = this.password;
    event.preventDefault();
  };

  async testConnection(item, index) {
    var con = this.props.connectionStore.connections[index];
    // console.log(item);
    con["loading"] = true;
    con["connectionStatus"] = "";
    // this.setState({ connections: cons });

    // let config = {
    //   port: con.port,
    //   password: con.password,
    //   user: con.username,
    //   server: con.server,
    //   database: con.database,
    //   connectionTimeout: con.connectionTimeout
    // };
    console.log(con.databaseConfig);
    await mssql.connect(
      con.databaseConfig,
      err => {
        // var cons = this.props.connectionStore.connections;
        con["loading"] = false;
        if (err) {
          con["connectionStatus"] = err["name"];
        } else {
          con["connectionStatus"] = "Success";
        }
        console.log(err);
        // this.setState({ connections: cons });
      }
    );
  }

  removeConnection(connection) {
    connection.delete();
  }

  selectConnection(connection) {
    this.props.selectedStore.connection = connection;
    //navigate to selected database
    this.props.history.push("/database/");
  }

  renderNewConnectionForm() {
    if (!this.showAddForm) {
      return null;
    }

    return (
      <form onSubmit={this.createFormConnection}>
        <div className="input-group">
          <input
            type="text"
            name="Database"
            required
            value={this.serverName}
            onChange={text => (this.serverName = text.target.value)}
          />
          <label className="floating-label">ServerName</label>
        </div>
        <div className="input-group">
          <input
            type="text"
            name="Database"
            required
            value={this.database}
            onChange={text => (this.database = text.target.value)}
          />
          <label className="floating-label">Database</label>
        </div>
        <div className="input-group">
          <input
            type="text"
            name="Database"
            required
            value={this.username}
            onChange={text => (this.username = text.target.value)}
          />
          <label className="floating-label">Username</label>
        </div>
        <div className="input-group">
          <input
            type="text"
            name="Database"
            required
            value={this.password}
            onChange={text => (this.password = text.target.value)}
          />
          <label className="floating-label">Password</label>
        </div>
        <input type="button" value="Test" onClick={this.testFormConnection} />
        <input type="submit" value="submit" />
        <p>{this.formConnectionStatus}</p>
      </form>
    );
  }

  renderConnections() {
    return this.props.connectionStore.connections.map((item, index) => {
      return (
        <div className="connection-card" key={item.id}>
          <p
            onClick={() => {
              this.selectConnection(item);
            }}
            className="card-title"
          >
            {item.server}:{item.database}
          </p>
          <div className="card-content">
            <p>
              Status: {item.loading ? "Loading" : ""}
              {item.connectionStatus ? item.connectionStatus : ""}
            </p>
            <div>
              <p
                className="button"
                onClick={() => this.testConnection(item, index)}
              >
                Test
              </p>
              <p
                className="button button-danger"
                onClick={() => this.removeConnection(item)}
              >
                Remove
              </p>
            </div>
          </div>
        </div>
      );
    });
  }

  render() {
    return (
      <div className="App">
        {/* <header className="App-header"> */}
        <div className="TopMenu">
          <p className="center-flex">Db select</p>
          <p onClick={() => (this.showAddForm = !this.showAddForm)}>
            New connection
          </p>
        </div>
        <div className="new-connection-area">
          {this.renderNewConnectionForm()}
        </div>
        <div>{this.renderConnections()}</div>
        {/* </header> */}
        <p
          onClick={() => {
            console.log(this.props.connectionStore);
            this.props.connectionStore.clearAllData();
          }}
        >
          Delete all data
        </p>
      </div>
    );
  }
}

export default DBSelectScreen;
