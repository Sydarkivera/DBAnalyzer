import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { observable } from 'mobx';
import { observer, inject } from 'mobx-react';
import '../App.css';

import { FaSearch } from 'react-icons/fa';
import ConnectionModal from '../components/ConnectionModal';
import ProgressBar, { VisualPart } from '../components/progressBar';
import SelectedStore from '../store/Selected';
import ShouldSaveButton from '../components/shouldSaveButton';
import TableStore, { ShouldSave } from '../store/Table';
import { STRUCTURE_STEPS } from '../store/DatabaseStructure';
import ExpandableListItem from '../components/ExpandableListItem';
import ConnectionStore from '../store/Connection';

interface PropsType {
  history: any,
  selected: SelectedStore
}

@inject('selected')
@observer
class DatabaseScreen extends Component<PropsType> {
  @observable searchText = '';

  @observable showEditForm = false;

  @observable formConnection = new ConnectionStore();

  // state: StateType;

  constructor(props: PropsType) {
    super(props);

    props.selected.connection.struture.fetchAllTables();
  }

  selectTable(table: TableStore) {
    const { selected, history } = this.props;
    selected.table = table;
    history.push('/database/table/');
  }

  openForm() {
    const { selected } = this.props;
    const { connection } = selected;
    this.formConnection.label = connection.label;
    this.formConnection.server = connection.server;
    this.formConnection.database = connection.database;
    this.formConnection.username = connection.username;
    this.formConnection.password = connection.password;
    this.formConnection.dbms = connection.dbms;
    this.showEditForm = true;
  }

  updateForm = () => {
    const { selected } = this.props;
    const { connection } = selected;
    connection.label = this.formConnection.label;
    connection.server = this.formConnection.server;
    connection.database = this.formConnection.database;
    connection.username = this.formConnection.username;
    connection.password = this.formConnection.password;
    connection.dbms = this.formConnection.dbms;
    connection.saveData();
    this.showEditForm = false;
  }

  calculateVisualParts(currentStep: number, numberOfSteps: number): VisualPart[] {
    const { selected } = this.props;
    const { struture } = selected.connection;

    const res: VisualPart[] = [];

    for (let i = 0; i < currentStep - 1; i++) {
      res.push({
        color: 'green',
        percentage: (100 / numberOfSteps),
      });
    }
    if (currentStep > 0 && currentStep <= numberOfSteps) {
      res.push({
        color: 'yellow',
        percentage: (100 / numberOfSteps) * struture.progress,
      });
    }

    return res;
  }

  renderAnalysisSection() {
    const { selected, history } = this.props;
    const { struture } = selected.connection;
    const step = struture.structureStep;
    const aStep = struture.analysisStep;
    if (!struture || struture.loading) {
      return <p>Loading, please wait</p>;
    }
    return (
      <>
        <div className="list">
          <ExpandableListItem title="Structure analysis" isRunning={struture.isRunning} isReady={step < 5} isComplete={step >= 5} onClick={() => struture.startStructureAnalysis(0, false)}>
            <p>
              The database has
              {' '}
              {struture.numExistingForeignKeys}
              {' '}
              Foreign keys and DBAnalyzer found
              {' '}
              {struture.numFoundForeignKeys}
              {' '}
              Potential Foreign Keys
            </p>
            { step < 5 && struture.isRunning
              && (
              <>
                <p>
                  {STRUCTURE_STEPS[step].name}
                  {' '}
                  {Math.round(struture.progress * 100)}
                  %
                </p>
                <ProgressBar label="label" visualParts={this.calculateVisualParts(step, 4)} />
              </>
              )}
          </ExpandableListItem>
          <ExpandableListItem title="Culling analysis" isRunning={false} isReady={step >= 5 && aStep < 4} isComplete={aStep >= 4} onClick={() => struture.startCulling(0)}>
            <p>Culling info...</p>
          </ExpandableListItem>
          <div className="list-item">
            <p style={{ fontWeight: 'bold' }}>Verify tables</p>
            { aStep >= 4
                && (
                <>
                  <p>
                    Found
                    {' '}
                    {struture.tablesToVerify.length}
                    {' '}
                    tables that needs to be verified
                  </p>
                  <button
                    className="button is-primary"
                    type="button"
                    onClick={() => { history.push('/database/verification'); }}
                  >
                    Verify
                  </button>
                </>
                )}
          </div>
        </div>
      </>
    );
  }

  renderTables() {
    const { selected } = this.props;
    const { struture } = selected.connection;

    let tablesSorted = struture.tables.slice().sort((a, b) => {
      if (a.rowCount > b.rowCount) {
        return -1;
      }
      return 1;
    });
    if (this.searchText !== '') {
      tablesSorted = tablesSorted.filter(
        (item) => item.tableName.toUpperCase().search(this.searchText.toUpperCase())
          > -1,
      );
    }

    return (
      <div className="box">
        <div className="field">
          <p className="control has-icons-left has-icons-right">
            <input
              className="input"
              type="email"
              placeholder="Search"
              value={this.searchText}
              onChange={(text) => { this.searchText = text.target.value; }}
            />
            <span className="icon is-small is-left">
              <FaSearch />
            </span>
          </p>
        </div>
        <table className="table is-striped is-hoverable is-fullwidth">
          <thead>
            <tr>
              <th style={{ maxWidth: 0 }}>Should save</th>
              <th>Table name</th>
              <th>Number of rows</th>
            </tr>
          </thead>
          <tbody>
            {
              tablesSorted.map((table: TableStore, i: number) => (
                <tr key={table.id} className="table-item">
                  <td className="table-item-name">
                    <ShouldSaveButton
                      shouldSave={table.shouldSave}
                      onChange={(val: ShouldSave) => { table.shouldSave = val; }}
                    />
                  </td>
                  <td onClick={() => this.selectTable(table)}>{table.tableName}</td>
                  <td>
                    {table.rowCount || 0}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    );
  }

  render(): any {
    const { selected } = this.props;

    return (
      <div className="DatabaseScreen">
        <nav className="navbar is-fixed-top" role="navigation" aria-label="main navigation">
          <div className="navbar-brand">
            <div className="navbar-item">
              <Link
                className="button is-primary"
                type="button"
                to="/"
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
            </h2>
          </div>
          <div className="navbar-menu">
            <div className="navbar-end">
              <div className="navbar-item">
                <div className="buttons">
                  <button
                    className="button is-primary"
                    type="button"
                    onClick={() => { this.openForm(); }}
                  >
                    <strong>Edit Database</strong>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <section className="section">

          {this.renderAnalysisSection()}
          {this.renderTables()}
          {/* modal for editing database */}
          <ConnectionModal
            show={this.showEditForm}
            onClose={() => { this.showEditForm = false; }}
            connection={this.formConnection}
            onSave={this.updateForm}
          />
        </section>
      </div>
    );
  }
}

export default DatabaseScreen;
