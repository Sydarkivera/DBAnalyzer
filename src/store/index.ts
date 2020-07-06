import ConnectionsStore from './Connections';
import SelectedStore from './Selected';
import ErrorStore from './ErrorStore';

class Store {
  connectionsStore: ConnectionsStore;

  selectedStore: SelectedStore;

  errorStore: ErrorStore;

  constructor() {
    this.errorStore = new ErrorStore();
    this.connectionsStore = new ConnectionsStore(this.errorStore);
    this.selectedStore = new SelectedStore(this.connectionsStore, this.errorStore);
  }
}

const store = new Store();
export default {
  store,
  connections: store.connectionsStore,
  selected: store.selectedStore,
  errorStore: store.errorStore,
};
