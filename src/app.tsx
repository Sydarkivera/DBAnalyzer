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

import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
import './App.css';

import { observer } from 'mobx-react';
import DBSelectScreen from './screens/databaseList';
import Database from './screens/database';
import TablePreviewScreen from './screens/tablePreview';
import VerificationScreen from './screens/verification';
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

// const App = inject('errorStore')(observer(({errorStore}: Props) => (
// <div style={{ backgroundColor: '#f7f7f7', minHeight: '100vh' }}>
//   <Switch>
//     <Route exact path="/" component={DBSelectScreen} />
//     <Route exact path="/database/" component={Database} />
//     <Route path="/database/table/" component={TablePreviewScreen} />
//     <Route
//       path="/database/verification/"
//       component={VerificationScreen}
//     />
//     <Route path="/" component={DBSelectScreen} />
//   </Switch>
//   <div>
//     {
//       errorStore.errors.map(() => {
//         return <article className="message is-danger">
//         <div className="message-header">
//           <p>Danger</p>
//           <button className="delete" aria-label="delete"></button>
//         </div>
//         <div className="message-body">
//           Lorem ipsum dolor sit amet, consectetur adipiscing elit. <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
//         </div>
//       </article>
//       })
//     }
//   </div>
// </div>
// )));
export default App;
