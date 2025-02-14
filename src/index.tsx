import { createRoot } from 'react-dom/client';
import { Provider } from 'mobx-react';
import './index.css';
import App from './App';
import stores from './store';
import 'react-bulma-components/dist/react-bulma-components.min.css';
import '@creativebulma/bulma-tooltip/dist/bulma-tooltip.min.css';

const root = createRoot(document.body);
root.render(
  <Provider {...stores}>
    <App errorStore={stores.errorStore} />
  </Provider>
);
