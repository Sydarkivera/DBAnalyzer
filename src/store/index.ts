import ConnectionsStore from './Connections';
import SelectedStore from './Selected';

class Store {
  connectionsStore: ConnectionsStore;

  selectedStore: SelectedStore;

  constructor() {
    this.connectionsStore = new ConnectionsStore();
    this.selectedStore = new SelectedStore(this.connectionsStore);
  }
}

const store = new Store();
export default {
  store,
  connections: store.connectionsStore,
  selected: store.selectedStore,
};
