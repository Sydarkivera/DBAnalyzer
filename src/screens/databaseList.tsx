import React, { Component } from 'react';
import { observable } from 'mobx';
import { observer, inject } from 'mobx-react';
import TextField from '../components/TextField';
import ConnectionStore from '../store/Connection';
import ConnectionsStore from '../store/Connections';
import SelectedStore from '../store/Selected';
import ConnectionModal from '../components/ConnectionModal';

interface PropsType {
  history: any,
  connections: ConnectionsStore,
  selected: SelectedStore
}

@inject('connections', 'selected')
@observer
class DBSelectScreen extends Component<PropsType> {
  @observable showAddForm = false;

  @observable demoConnection: ConnectionStore = new ConnectionStore();

  @observable formConnectionStatus = '';

  testFormConnection = async () => {
    this.demoConnection.testConnection();
  };

  createFormConnection = (event: any) => {
    const { connections } = this.props;
    connections.addConnection(this.demoConnection);
    this.demoConnection = new ConnectionStore();
  };

  removeConnection(connection: ConnectionStore) {
    const { connections } = this.props;

    // TODO: add confirmation
    connections.delete(connection.id);
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
          onClick={() => this.removeConnection(item)}
        >
          Remove
        </p>
      </div>
    ));
  }

  render() {
    return (
      <>
        <nav className="navbar is-fixed-top" role="navigation" aria-label="main navigation">
          <div className="navbar-brand">
            <a className="navbar-item" href="https://bulma.io">
              DB Analyzer
            </a>
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
