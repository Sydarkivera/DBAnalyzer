import React, { Component } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import './App.css';

import ErrorStore from './store/ErrorStore';
import { observer } from 'mobx-react';

import DatabaseSelectScreen from './screens/DatabaseSelect.screen';
import DatabaseScreen from './screens/Database.screen';
import TablePreviewScreen from './screens/TablePreview.screen';
import TableVerificationScreen from './screens/TableVerification.screen';
import store from './store';

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
          <Route index element={<DatabaseSelectScreen history={history} connections={store.connections} selected={store.selected} errorStore={store.errorStore}/>} />
          <Route path="database" element={<DatabaseScreen history={history} selected={store.selected} errorStore={store.errorStore}/>}>
            <Route path="table" element={<TablePreviewScreen history={history} selected={store.selected} />} />
            <Route path="verification" element={<TableVerificationScreen selected={store.selected}/>} />
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
