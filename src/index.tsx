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
import DBSelectScreen from './screens/DatabaseList';
import Database from './database';
import TablePreviewScreen from './screens/TablePreview';
import TableVerificationScreen from './screens/TableVerification';

const root = ReactDOM.createRoot(
    document.getElementById("root")
);

root.render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<App />}>
                <Route index element={<DBSelectScreen />} />
                <Route path="database" element={<Database />}>
                    <Route path="table" element={<TablePreviewScreen />} />
                    <Route path="verification" element={<TableVerificationScreen />} />
                </Route>
            </Route>
            <Route element={<PageLayout />}>
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/tos" element={<Tos />} />
            </Route>
            <Route path="contact-us" element={<Contact />} />
        </Routes>
    </BrowserRouter>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
