import React, { Component } from 'react';
import { BrowserRouter, createBrowserRouter, Outlet, Route, RouterProvider, Routes } from 'react-router-dom';
import './App.css';

import DBSelectScreen from './screens/DatabaseList';
import Database from './screens/Database';
import TablePreviewScreen from './screens/TablePreview';
import VerificationScreen from './screens/TableVerification';
import ErrorStore from './store/ErrorStore';
import { observer } from 'mobx-react';

interface Props {
  errorStore: ErrorStore
}

class App {
  render() {
    return (
      <>
        <header></header>
        <body>
        </body>
        <footer></footer>
      </>
    );
  }
};

export default App;
