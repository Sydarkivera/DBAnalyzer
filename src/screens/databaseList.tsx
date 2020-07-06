import React, { Component, MouseEvent } from 'react';
import { observable } from 'mobx';
import { observer, inject } from 'mobx-react';
import ErrorStore from 'src/store/ErrorStore';
import ConnectionStore from '../store/Connection';
import ConnectionsStore from '../store/Connections';
import SelectedStore from '../store/Selected';
import ConnectionModal from '../components/ConnectionModal';

interface PropsType {
  history: any,
  connections: ConnectionsStore,
  selected: SelectedStore,
  errorStore: ErrorStore
}

@inject('connections', 'selected', 'errorStore')
@observer
class DBSelectScreen extends Component<PropsType> {
  @observable showAddForm = false;

  @observable demoConnection: ConnectionStore;

  @observable formConnectionStatus = '';

  constructor(props: PropsType) {
    super(props);
    // console.log(props.errorStore);

    this.demoConnection = new ConnectionStore(props.errorStore);
  }

  testFormConnection = async () => {
    this.demoConnection.testConnection();
  };

  createFormConnection = (event: any) => {
    const { connections, errorStore } = this.props;
    connections.addConnection(this.demoConnection);
    this.demoConnection = new ConnectionStore(errorStore);
    this.showAddForm = false;
  };

  removeConnection(e: MouseEvent, connection: ConnectionStore) {
    const { connections } = this.props;

    e.stopPropagation();
    if (confirm(`Are you sure you want to remove: ${connection.cLabel}`)) {
      connections.delete(connection.id);
    }
  }

  selectConnection(connection: ConnectionStore) {
    const { selected, history } = this.props;
    selected.connection = connection;
    // this.props.selectedStore.connection = connection;
    // //navigate to selected database
    history.push('/database/');
  }

  renderConnections() {
    const { connections } = this.props;

    return connections.connections.map((item, index) => (
      <div
        className="box"
        key={item.id}
        onClick={() => {
          this.selectConnection(item);
        }}
      >
        <p>
          {item.cLabel}
        </p>
        <p>
          Status:
          {' '}
          {item.loading ? 'Loading' : ''}
          {item.status ? item.status : ''}
        </p>
        <p
          className="button"
          onClick={(e) => {
            e.stopPropagation();
            item.testConnection();
          }}
        >
          Test
        </p>
        <p
          className="button button-danger"
          onClick={(e) => this.removeConnection(e, item)}
        >
          Remove
        </p>
      </div>
    ));
  }

  render() {
    return (
      <>
        <nav className="navbar is-fixed-top" aria-label="main navigation">
          <div className="navbar-brand">
            <p className="navbar-item">
              DB Analyzer
            </p>
          </div>
          <div className="navbar-menu">
            <div className="navbar-end">
              <div className="navbar-item">
                <div className="buttons">
                  <button
                    className="button is-primary"
                    type="button"
                    onClick={
                    () => { this.showAddForm = !this.showAddForm; }
                    }
                  >
                    <strong>New Connection</strong>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <section className="section">
          {/* <Navbar></Navbar> */}
          {/* <header className="App-header"> */}
          {/* <div className="TopMenu">
            <p className="center-flex">Db select</p>
            <p onClick={() => (this.showAddForm = !this.showAddForm)}>
              New connection
            </p>
          </div> */}

          {/* {this.renderNewConnectionForm()} */}
          <ConnectionModal
            show={this.showAddForm}
            onClose={() => { this.showAddForm = false; }}
            connection={this.demoConnection}
            onSave={this.createFormConnection}
          />
          {this.renderConnections()}
          {/* </header> */}
          {/* <p
            onClick={() => {
              console.log(this.props.connectionStore);
              this.props.connectionStore.clearAllData();
            }}
          >
            Delete all data
          </p> */}
        </section>
      </>
    );
  }
}

export default DBSelectScreen;
