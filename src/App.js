import React, { Component } from "react";
import { Switch, Route } from "react-router-dom";
import "./App.css";

import DBSelectScreen from "./screens/dbSelect";
import Database from "./screens/database";
import TablePreview from "./screens/tablePreview";
import TableVerificationScreen from "./screens/verification";

class App extends Component {
  render() {
    return (
      <div className="App">
        <Switch>
          <Route exact path="/" component={DBSelectScreen} />
          <Route exact path="/database/" component={Database} />
          <Route path="/database/table/" component={TablePreview} />
          <Route
            path="/database/verification/"
            component={TableVerificationScreen}
          />
        </Switch>
      </div>
    );
  }
}

export default App;
