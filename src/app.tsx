// import React from 'react';
// import ReactDom from 'react-dom';

// const mainElement = document.createElement('div');
// document.body.appendChild(mainElement);
// const App = () => (
//   <h1>
//     Hi from a react app
//   </h1>
// );
// ReactDom.render(<App />, mainElement);

import React, { } from 'react';
import { Switch, Route } from 'react-router-dom';
import './App.css';

import DBSelectScreen from './screens/databaseList';
import Database from './screens/database';
import TablePreviewScreen from './screens/tablePreview';
import VerificationScreen from './screens/verification';

const App = () => (
  <div style={{ backgroundColor: '#f7f7f7', minHeight: '100vh' }}>
    <Switch>
      <Route exact path="/" component={DBSelectScreen} />
      <Route exact path="/database/" component={Database} />
      <Route path="/database/table/" component={TablePreviewScreen} />
      <Route
        path="/database/verification/"
        component={VerificationScreen}
      />
      <Route path="/" component={DBSelectScreen} />
    </Switch>
  </div>
);
export default App;
