/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import stores from './store';
import 'react-bulma-components/dist/react-bulma-components.min.css';
import '@creativebulma/bulma-tooltip/dist/bulma-tooltip.min.css';

ReactDOM.render(
  <BrowserRouter>
    <Provider {...stores}>
      <App errorStore={stores.errorStore} />
    </Provider>
  </BrowserRouter>,
  document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
