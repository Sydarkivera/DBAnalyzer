/* eslint-disable react/jsx-props-no-spreading */
import ReactDOM from 'react-dom/client';
import React from 'react';

import { Provider } from 'mobx-react';
import stores from './store';

import * as serviceWorker from './serviceWorker';

import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider {...stores}>
      <App errorStore={stores.errorStore} />
    </Provider>
  </React.StrictMode>
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
