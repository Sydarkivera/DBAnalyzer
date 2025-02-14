import { Component } from 'react';
import { Routes, Route } from 'react-router-dom';
import { observer } from 'mobx-react';

import DBSelectScreen from './screens/DatabaseList';
import Database from './screens/Database';
import TablePreviewScreen from './screens/TablePreview';
import VerificationScreen from './screens/Verification';
import ErrorStore from './store/ErrorStore';
import store from './store';
import './App.css';

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
          <Route path="/" element={<DBSelectScreen history={history} connections={store.connections} selected={store.selected} errorStore={store.errorStore}/>} />
          <Route path="/database/" element={<Database history={history} selected={store.selected} errorStore={store.errorStore}/>} />
          <Route path="/database/table/" element={<TablePreviewScreen history={history} selected={store.selected}/>} />
          <Route path="/database/verification/" element={<VerificationScreen selected={store.selected}/>}/>
          <Route path="/" element={<DBSelectScreen history={history} connections={store.connections} selected={store.selected} errorStore={store.errorStore}/>} />
        </Routes>
        <div style={{
          position: 'fixed', bottom: 0, right: '10%', left: '10%',
        }}
        >
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
