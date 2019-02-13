import React, { Component } from "react";
import { Switch, Route } from "react-router-dom";
import "./App.css";

import DBSelectScreen from "./screens/dbSelect";
import Database from "./screens/database";

class App extends Component {
  render() {
    return (
      <div className="App">
        <Switch>
          <Route exact path="/" component={DBSelectScreen} />
          <Route path="/database/" component={Database} />
        </Switch>
      </div>
    );
  }
}

export default App;
