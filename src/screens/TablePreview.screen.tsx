import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import { observable } from 'mobx';
import '../App.css';
import SelectedStore from '../store/Selected';
import TableComponent from '../components/Table';

interface PropsType {
  selected: SelectedStore,
  history: any,
}

@inject('selected')
@observer
class TablePreviewScreen extends Component<PropsType> {
  @observable data: any[] = [];

  @observable structure: any[] = [];

  @observable start = 0;

  @observable interval = 30;

  @observable popupTable: any = undefined;

  @observable poppupColumns: any[] = [];

  allowData = true;

  constructor(props: PropsType) {
    super(props);

    if (!props.selected.connection.struture) {
      props.selected.connection.loadDatabaseStructure();
    }
    if (props.selected.connection.struture) {
      props.selected.connection.struture.fetchAllTables();
    }

    if (props.selected.table) {
      props.selected.table.fetchColumns().then(() => {
      });
    }
  }

  render() {
    const { selected } = this.props;
    if (!selected.connection.struture) {
      return null;
    }

    return (
      <div className="DatabaseScreen">
        <nav className="navbar is-fixed-top" aria-label="main navigation">
          <div className="navbar-brand">
            <div className="navbar-item">
              <Link
                className="button is-primary"
                type="button"
                to="/database/"
              >
                <strong>Back</strong>
              </Link>
            </div>
          </div>
          <div className="navbar-start">
            <h2 className="navbar-item">
              {selected.connection
                ? selected.connection.cLabel
                : ''}
              {' '}
              :
              {' '}
              {selected.table
                ? selected.table.tableName
                : ''}
            </h2>
          </div>
        </nav>
        <div className="section">
          <TableComponent
            table={selected.table}
            structure={selected.connection.struture}
          />
        </div>
      </div>
    );
  }
}

export default TablePreviewScreen;
