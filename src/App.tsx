import React, { Component } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import './App.css';

import ErrorStore from './store/ErrorStore';
import { observer } from 'mobx-react';

import DatabaseSelectScreen from './screens/DatabaseSelect.screen';
import DatabaseScreen from './screens/Database.screen';
import TablePreviewScreen from './screens/TablePreview.screen';
import TableVerificationScreen from './screens/TableVerification.screen';

interface Props {
  errorStore: ErrorStore
}

@observer
class App extends Component<Props> {
  render() {
    const { errorStore } = this.props;
    return (
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DatabaseSelectScreen />} />
          <Route path="database" element={<DatabaseScreen />}>
            <Route path="table" element={<TablePreviewScreen />} />
            <Route path="verification" element={<TableVerificationScreen />} />
          </Route>
        </Route>
      </Routes>
    );
  }
}

function Layout() {
  return (
    <>
      <header></header>
      <main>
        <Outlet />
      </main>
      <footer></footer>
    </>
  );
}

export default App;
