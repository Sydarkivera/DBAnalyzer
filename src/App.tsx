import React, { Component } from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css';

import { observer } from 'mobx-react';
import DBSelectScreen from './screens/DatabaseList';
import Database from './screens/Database';
import TablePreviewScreen from './screens/TablePreview';
import VerificationScreen from './screens/Verification';
import ErrorStore from './store/ErrorStore';

interface Props {
  errorStore: ErrorStore
}

@observer
class App extends Component<Props> {
  render() {
    const { errorStore } = this.props;
    return (
      <div style={{ backgroundColor: '#f7f7f7', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<DBSelectScreen/>} />
          <Route path="/database/" element={<Database/>} />
          <Route path="/database/table/" element={<TablePreviewScreen/>} />
          <Route path="/database/verification/" element={<VerificationScreen/>} />
          <Route path="/" element={<DBSelectScreen/>} />
        </Routes>
        <div style={{position: 'fixed', bottom: 0, right: '10%', left: '10%'}}>
          {
            errorStore.errors.map((error) => (
              <article className="message is-danger" key={error.id}>
              <div className="message-header">
              <p>{error.title}</p>
              <button className="delete" aria-label="delete" type="button" onClick={() => { errorStore.remove(error.id); }} />
              </div>
              <div className="message-body">
              {error.body}
              </div>
              </article>
            ))
          }
        </div>
      </div>
    );
  }
}

export default App;
