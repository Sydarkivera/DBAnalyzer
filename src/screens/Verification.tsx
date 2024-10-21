import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { observable } from 'mobx';
import { observer, inject } from 'mobx-react';
import '../App.css';
import SelectedStore from 'src/store/Selected';
import TableComponent from '../components/Table';
import VerifyTable from '../components/VerifyTable';

interface PropType {
  selected: SelectedStore,
}

@inject('selected')
@observer
class TableVerificationScreen extends Component<PropType> {
  @observable loadingTables = false;

  @observable tables: any[] = [];

  @observable numberOfEmptyTables = 0;

  @observable totalRows = 0;

  @observable loading = false;

  @observable candidateProgress = 0;

  @observable foreignProgress = 0;

  @observable tableStructureLoaded = 0;

  @observable tableCandidateKeysLoaded = 0;

  @observable tableForeignKeysLoaded = 0;

  @observable columnsCheckedFoNull = 0;

  @observable numberOfTablesWithOneColumn = 0;

  @observable step = 0;

  @observable poppupColumns: any[] = [];

  @observable popupTable: any = undefined;

  constructor(props: PropType) {
    super(props);

    if (!props.selected.connection.struture) {
      props.selected.connection.loadDatabaseStructure();
    }
    if (props.selected.connection.struture) {
      props.selected.connection.struture.fetchAllTables();
    }
  }

  openPopup(tableName: string) {
    this.popupTable = tableName;
    this.poppupColumns = [];
  }

  selectForeignKey(key: any) {
    if (!key.table) {
      this.popupTable = key.pkTable;
      this.poppupColumns = key.pkColumn;
    } else {
      this.popupTable = key.table;
      this.poppupColumns = key.pointingOnColumn;
    }
  }

  renderPopup() {
    const { selected } = this.props;
    if (
      !this.popupTable
    || !selected.connection.struture
    ) {
      return null;
    }

    return (
      <div className="modal is-active">
        <div className="modal-background" onClick={() => { this.popupTable = ''; }} />
        <div className="modal-content" style={{ width: '90%' }}>
          <TableComponent
            table={selected.connection.struture.getTableByName(
              this.popupTable,
            )}
            structure={selected.connection.struture}
            highlightColumns={this.poppupColumns}
            selectForeignKey={(key:any) => this.selectForeignKey(key)}
          />
        </div>
        <button type="button" className="modal-close is-large" aria-label="close" onClick={() => { this.popupTable = ''; }} />
      </div>
    );
  }

  renderSmallList() {
    const { selected } = this.props;
    const { struture } = selected.connection;
    if (!struture) {
      return null;
    }
    let id = 0;

    return (
      <div className="box">
        <h3>Tables which are too small to be relevant</h3>
        {struture.tablesToVerify
          .filter((item) => item.type !== 'island' && item.type !== 'single')
          .map((item) => (
            <VerifyTable
              key={id++}
              tables={struture.tables}
              item={item}
              previewTable={(name: any) => this.openPopup(name)}
            />
          ))}
      </div>
    );
  }

  renderNoConnections() {
    const { selected } = this.props;
    const { struture } = selected.connection;
    if (!struture) {
      return null;
    }
    let id = 0;

    return (
      <div className="box">
        <h3>Tables with no connections</h3>
        {struture.tablesToVerify
          .filter((item) => item.type === 'single')
          .map((item, i) => (
            <VerifyTable
              key={id++}
              tables={struture.tables}
              item={item}
              previewTable={(name: any) => this.openPopup(name)}
            />
          ))}
      </div>
    );
  }

  renderFewConnections() {
    const { selected } = this.props;
    const { struture } = selected.connection;
    if (!struture) {
      return null;
    }
    let id = 0;

    return (
      <div className="box">
        <h3>Tables with no relevant connections making them useless</h3>
        {struture.tablesToVerify
          .filter((item) => item.type === 'island')
          .map((item, i) => (
            <VerifyTable
              key={id++}
              tables={struture.tables}
              item={item}
              previewTable={(name: any) => this.openPopup(name)}
            />
          ))}
      </div>
    );
  }

  render() {
    const { selected } = this.props;
    const { connection } = selected;

    // list tables that should be verified.
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
              {connection.cLabel}
            </h2>
          </div>
        </nav>
        <div className="section">
          {this.renderSmallList()}
          {this.renderNoConnections()}
          {this.renderFewConnections()}
          {this.renderPopup()}
        </div>
      </div>
    );
  }
}

export default TableVerificationScreen;
