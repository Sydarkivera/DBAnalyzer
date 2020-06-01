
const mssql = window.require("mssql");
var mysql = window.require('mysql');

export function connect(data, dbms) {

  return new Promise(async (resolve, reject) => {



  if (dbms === "mysql") {
    var con = mysql.createConnection({
      host: data.serverName,
      user: data.username,
      password: data.password,
      database: data.database
    });
    
    con.connect(function(err) {
      if (err) reject(err);
      resolve(con);
    });

  } else if (dbms === "mssql") {
    await mssql.connect(
      {
        server: data.serverName,
        database: data.database,
        user: data.username,
        password: data.password
      },
      err => {
        // var cons = this.props.connectionStore.connections;
        // con["loading"] = false;
        if (err) {
          this.formConnectionStatus = err["name"];
          reject(err);
        } else {
          this.formConnectionStatus = "Success";
          resolve();
        }
        // console.log(err);
        // this.setState({ connections: cons });
      }
    );
  }

  })

}