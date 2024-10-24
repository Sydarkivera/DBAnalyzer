import React from 'react';
import { BrowserRouter, createBrowserRouter, Outlet, Route, RouterProvider, Routes } from 'react-router-dom';
import './App.css';

import DBSelectScreen from './screens/DatabaseList';
import Database from './screens/Database';
import TablePreviewScreen from './screens/TablePreview';
import VerificationScreen from './screens/Verification';
import ErrorStore from './store/ErrorStore';
import { observer } from 'mobx-react';

interface Props {
  errorStore: ErrorStore
}

const Root = observer(
  () => {
    return (
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DBSelectScreen />} />
            <Route path="/database/" element={<Database />} />
            <Route path="/database/table/" element={<TablePreviewScreen />} />
            <Route path="/database/verification/" element={<VerificationScreen />} />
          </Route>
        </Routes>
      </BrowserRouter >
    );
  }
);

function Layout() {
  return (
    <>
      <header> {/* TODO: Use header code from App.tsx version 1.0.0 */} </header>
      <main>
        <Outlet />
      </main>
      <footer> {/* TODO: Use code from App.tsx version 1.0.0 */} </footer>
    </>
  );
}

// Router singleton created
const router = createBrowserRouter([
  { path: "*", element: <Root /> },
]);

// RouterProvider added
export default function App() {
  return <RouterProvider router={router} />;
}
