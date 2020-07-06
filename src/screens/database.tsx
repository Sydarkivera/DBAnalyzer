import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { observable } from 'mobx';
import { observer, inject } from 'mobx-react';
import '../App.css';

import { FaSearch } from 'react-icons/fa';
import ErrorStore from 'src/store/ErrorStore';
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
  selected: SelectedStore,
  errorStore: ErrorStore
}

@inject('selected', 'errorStore')
@observer
class DatabaseScreen extends Component<PropsType> {
  @observable searchText = '';

  @observable showEditForm = false;

  @observable formConnection: ConnectionStore

  // state: StateType;

  constructor(props: PropsType) {
    super(props);

    this.formConnection = new ConnectionStore(props.errorStore);

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

    const datatypes: {[id: string]: number} = {};
    for (let i = 0; i < struture.tables.length; i++) {
      const table = struture.tables[i];
      for (let j = 0; j < table.columns.length; j++) {
        const column = table.columns[j];
        if (datatypes[column.dataType]) {
          datatypes[column.dataType] += 1;
        } else {
          datatypes[column.dataType] = 1;
        }
      }
    }
    // console.log(datatypes);

    return (
      <>
        <div className="list">
          <ExpandableListItem title="Database info" isReady={false} isRunning={false} isComplete={false}>
            <p>
              Number of tables:
              {' '}
              {struture.numTables}
            </p>
            <p>
              Empty tables:
              {' '}
              {struture.numEmpty}
            </p>
            <p>
              Total number of columns:
              {' '}
              {struture.tables.reduce((reducer, item) => reducer + item.columns.length, 0)}
            </p>
            <ExpandableListItem title="Datatypes" isReady={false} isRunning={false} isComplete={false}>
              {/* {datatypes.map((table) => table.tableName).join(', ')} */}
              {
                Object.keys(datatypes).map((key) => (
                  <p key={key}>
                    {key}
                    {': '}
                    {datatypes[key]}
                  </p>
                ))
              }
            </ExpandableListItem>
          </ExpandableListItem>
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
            {step >= 5 && !struture.isRunning
              && (
              <button
                className="button is-danger"
                type="button"
                onClick={(e) => { struture.analysisStep = 0; struture.structureStep = 0; struture.startStructureAnalysis(0, false); e.stopPropagation(); }}
              >
                Run again
              </button>
              )}
          </ExpandableListItem>
          <ExpandableListItem title="Culling analysis" isRunning={false} isReady={step >= 5 && aStep < 4} isComplete={aStep >= 4} onClick={() => struture.startCulling(0)}>
            {aStep >= 4 && <p>Done</p>}
            {aStep >= 4
              && (
              <button
                className="button is-danger"
                type="button"
                onClick={(e) => { struture.analysisStep = 0; struture.startCulling(0); e.stopPropagation(); }}
              >
                Run again
              </button>
              )}
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
          <ExpandableListItem title="Tables that are marked as to be saved" isReady={false} isRunning={false} isComplete={false}>
            {struture.tables.filter((item) => item.shouldSave !== ShouldSave.No).map((item) => item.tableName).join(', ')}
          </ExpandableListItem>
        </div>
      </>
    );
  }

  renderColumnSearch() {
    const { selected } = this.props;
    const { struture } = selected.connection;

    if (this.searchText === '') {
      return false;
    }

    const tablesWithColumn = struture.tables.reduce((reducer: any[], table) => {
      const foundColumns = table.columns.filter((column) => column.columnName.toUpperCase().search(this.searchText.toUpperCase()) > -1).map((column) => column.columnName);
      // console.log(foundColumns);
      if (foundColumns.length > 0) {
        // console.log(foundColumns);

        return [...reducer, {
          tableName: table.tableName,
          columns: foundColumns,
          table,
        }];
      }
      return reducer;
    }, []);
    // console.log(tablesWithColumn.map((table) => `${table.tableName} - ${table.columns.join(', ')}`));

    if (tablesWithColumn.length <= 0) {
      return null;
    }

    return (
      <>
        <h2 style={{ fontWeight: 'bold' }}>Table with matching columnNames</h2>
        <table className="table is-hoverable is-fullwidth">
          <thead>
            <tr>
              <th>Table name</th>
              <th>Matching columns</th>
            </tr>
          </thead>
          <tbody>
            {tablesWithColumn.length > 0
          && tablesWithColumn.map((table) => {
            // console.log(table);

            const res = [
              (
                <tr key={table.id} className="table-item" onClick={() => this.selectTable(table.table)}>
                  <td rowSpan={table.columns.length}>{table.tableName}</td>
                  <td>
                    {table.columns[0]}
                  </td>
                </tr>
              ),
            ];

            for (let i = 1; i < table.columns.length; i++) {
              res.push((
                <tr key={table.id} className="table-item" onClick={() => this.selectTable(table.table)}>
                  <td>
                    {table.columns[i]}
                  </td>
                </tr>
              ));
            }

            return res;
          })}
          </tbody>
        </table>

      </>
    );
  }

  renderDataTypeSearch() {
    const { selected } = this.props;
    const { struture } = selected.connection;

    if (this.searchText === '') {
      return false;
    }

    const tablesWithColumn = struture.tables.reduce((reducer: any[], table) => {
      const foundColumns = table.columns
        .filter((column) => column.dataType.toUpperCase().search(this.searchText.toUpperCase()) > -1)
        .map((column) => ({ dataType: column.dataType, columnName: column.columnName }));
      // console.log(foundColumns);
      if (foundColumns.length > 0) {
        // console.log(foundColumns);

        return [...reducer, {
          tableName: table.tableName,
          columns: foundColumns,
          table,
        }];
      }
      return reducer;
    }, []);

    if (tablesWithColumn.length <= 0) {
      return null;
    }

    return (
      <>
        <h2 style={{ fontWeight: 'bold' }}>Table with matching data types</h2>
        <table className="table is-hoverable is-fullwidth">
          <thead>
            <tr>
              <th>Table name</th>
              <th>Column</th>
              <th>Datatype</th>
            </tr>
          </thead>
          <tbody>
            {tablesWithColumn.length > 0
          && tablesWithColumn.map((table) => {
            // console.log(table);

            const res = [
              (
                <tr key={table.id} className="table-item" onClick={() => this.selectTable(table.table)}>
                  <td rowSpan={table.columns.length}>{table.tableName}</td>
                  <td>
                    {table.columns[0].columnName}
                  </td>
                  <td>
                    {table.columns[0].dataType}
                  </td>
                </tr>
              ),
            ];

            for (let i = 1; i < table.columns.length; i++) {
              res.push((
                <tr key={table.id} className="table-item" onClick={() => this.selectTable(table.table)}>
                  <td>
                    {table.columns[i].columnName}
                  </td>
                  <td>
                    {table.columns[i].dataType}
                  </td>
                </tr>
              ));
            }

            return res;
          })}
          </tbody>
        </table>

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
        {this.renderColumnSearch()}
        {this.renderDataTypeSearch()}
      </div>
    );
  }

  render(): any {
    const { selected } = this.props;

    return (
      <div className="DatabaseScreen">
        <nav className="navbar is-fixed-top" aria-label="main navigation">
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
