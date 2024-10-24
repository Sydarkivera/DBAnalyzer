import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
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
