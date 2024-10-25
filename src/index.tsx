/* eslint-disable react/jsx-props-no-spreading */
import ReactDOM from 'react-dom/client';
import React from 'react';
import * as serviceWorker from './serviceWorker';
import 'react-bulma-components/dist/react-bulma-components.min.css';
import '@creativebulma/bulma-tooltip/dist/bulma-tooltip.min.css';

import { registerRoute } from './lib/electron-router-dom'


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
