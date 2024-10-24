import {
  observable, computed, IReactionDisposer, reaction,
} from 'mobx';
import { v4 as uuid } from 'uuid';
import { testKeyLikeliness } from '../functions/permutations';
import DatabaseManager from '../database';
import ConnectionStore from './Connection';
import TableStore, { ShouldSave } from './Table';
import ErrorStore from './ErrorStore';

const FileStore = window.require('electron-store');
const fileStore = new FileStore();

export const STRUCTURE_STEPS = [
  {
    name: 'not started',
  },
  {
    name: 'Load Column Data',
  },
  {
    name: 'Find NULL Columns',
  },
  {
    name: 'Find Candidate Keys',
  },
  {
    name: 'Find Foreign Keys',
  },
  {
    name: 'Structure Analysis complete',
  },
];

export default class DatabaseStructureStore {
  @observable tables: TableStore[] = [];

  @observable loading = false;

  @observable id = '';

  @observable tablesToVerify: any[] = [];

  @observable structureStep = 1;

  @observable analysisStep = 0;

  @observable progress = 0;

  @observable isRunning = false;

  @observable autoSave = true;

  @observable ignoreFoundKeys = false;

  @observable likelinessThreshold = 0.8;

  @observable candidateKeyProgress: string[] = []

  @observable foreignKeyProgress: string[] = []

  connection: ConnectionStore;

  errorStore: ErrorStore

  saveHandler: IReactionDisposer;

  constructor(connection: ConnectionStore, errorStore: ErrorStore, id = '') {
    this.connection = connection;
    this.errorStore = errorStore;

    if (id !== '') {
      // load data from storage
      this.id = id;
      this.loadSavedData(id);
    } else {
      // give id
      this.id = uuid();
    }

    this.saveHandler = reaction(
      () => this.json,
      (json) => {
        if (this.autoSave) {
          this.saveData();
        }
      },
    );
  }

  loadSavedData(id: string) {
    const data = fileStore.get(`structure_${id}`);
    if (data) {
      this.structureStep = data.structureStep;
      this.analysisStep = data.analysisStep;
      this.tablesToVerify = data.tablesToVerify;
      this.candidateKeyProgress = data.candidateKeyProgress || [];
      this.foreignKeyProgress = data.foreignKeyProgress || [];
      for (const index in data.tables) {

        this.tables.push(new TableStore(this.connection, this.errorStore, data.tables[index]));
      }
    }
    this.tables.forEach((table) => {
      if (table.tableName === 'dtproperties') {
        table.columns = [];
        table.fetchColumns();
      }
    });
  }

  saveData() {
    try {
      fileStore.set(`structure_${this.id}`, this.json);
    } catch (e) {
    }
  }

  @computed get json() {
    return {
      structureStep: this.structureStep,
      analysisStep: this.analysisStep,
      candidateKeyProgress: this.candidateKeyProgress,
      foreignKeyProgress: this.foreignKeyProgress,
      tablesToVerify: this.tablesToVerify,
      tables: this.tables.map((table) => table.id),
    };
  }

  @computed get remaining() {
    return this.tables.length - this.tablesToVerify.length - this.numEmpty;
  }

  @computed get numTables() {
    return this.tables.length;
  }

  @computed get numEmpty() {
    return this.tables.filter((item) => item.rowCount <= 0).length;
  }

  @computed get numNonEmpty() {
    return this.numTables - this.numEmpty;
  }

  @computed get numExistingForeignKeys() {
    return this.tables.reduce((reducer, item) => reducer + item.foreignKeys.length, 0);
  }

  @computed get numFoundForeignKeys() {
    return this.tables.reduce((reducer, item) => reducer + item.foundForeignKeys.length, 0);
  }

  async fetchAllTables() {
    console.log('fetch all tables');
    console.log(this.tables.length);

    if (this.tables.length > 0) {
      return;
    }

    console.log('fetching tables');

    const result = await DatabaseManager.fetchAllTables(this.connection.connectionData);
    console.log('resu: ', result);

    const tables = [];
    for (const index in result) {
      const row = result[index];

      const table = new TableStore(this.connection, this.errorStore);
      table.tableName = row.TableName;
      table.rowCount = parseInt(row.TotalRowCount, 10);
      if (table.rowCount === 0) {
        table.shouldSave = ShouldSave.No;
      }
      tables.push(table);
    }
    this.tables = tables;
  }

  // start the objective analysis.
  // This fetches all the columns and their data,
  // identifies potential candidate keys
  // and finds all potential foreign keys.
  async startStructureAnalysis(start = 0, resume = false) {
    if (!resume) {
      this.structureStep = 1;
      this.tablesToVerify = [];

      // reset progress
      for (const key in this.tables) {
        const table = this.tables[key];
        if (table.rowCount > 0) {
          table.foundForeignKeys = [];
        }
      }
    } else {
      start = this.structureStep - 1;
    }
    this.isRunning = true;
    let a = 0;
    if (start <= a++) {
      if (!await this.loadAllTableColumns()) {
        this.isRunning = false;
        return;
      }
      this.structureStep += 1;
    }

    if (start <= a++) {
      if (!await this.findNullColumns()) {
        this.isRunning = false;
        return;
      }
      this.structureStep += 1;
    }
    if (start <= a++) {
      if (!await this.findCandidateKeys()) {
        this.isRunning = false;
        return;
      }
      this.structureStep += 1;
    }
    if (start <= a++) {
      if (!await this.findForeignKeys()) {
        this.isRunning = false;
        return;
      }
      this.structureStep += 1;
    }
    this.isRunning = false;
  }

  async startCulling(start = 0) {
    this.analysisStep = 1;

    let a = 0;

    if (start <= a++) {
      this.removoeEmptyTables();
      this.analysisStep += 1;
    }

    if (start <= a++) {
      this.findTablesWithOneColumn();
      this.analysisStep += 1;
    }

    if (start <= a++) {
      this.findTablesWithNoRelations();
      this.analysisStep += 1;
    }

    //  eliminate foreign keys that is defined in the database.

    // eliminate forreign keys that don't have names that match.

    // identify islands
    if (start <= a++) {
      this.findIslands();
      this.analysisStep += 1;
    }
  }

  getTable(id: string) {
    return this.tables.find((item) => item.id === id);
  }

  getTableByName(tableName: string) {
    return this.tables.find((item) => item.tableName === tableName);
  }

  async loadAllTableColumns() {
    this.progress = 0;
    let i = 0;
    for (const key in this.tables) {
      const table = this.tables[key];
      if (table.rowCount > 0) {
        try {
          await table.fetchColumns();
        } catch (e) {
          this.errorStore.add(`Error loading column data for table: "${table.tableName}"`, e.message);
          return false;
        }
      }
      i++;
      this.progress = i / this.tables.length;
    }
    return true;
  }

  async findNullColumns() {
    this.progress = 0;
    let i = 0;
    for (const key in this.tables) {
      const table = this.tables[key];
      if (table.rowCount > 0) {
        try {
          await table.findNullColumns();
        } catch (e) {
          this.errorStore.add(`Error finding column with no data in table: "${table.tableName}"`, e.message);
          return false;
        }
      }
      i++;
      this.progress = i / this.tables.length;
    }
    return true;
  }

  findTablesWithOneColumn() {
    let i = 0;
    for (const key in this.tables) {
      const table = this.tables[key];
      if (table.rowCount > 0) {
        if (table.columns.length <= 1) {
          this.tablesToVerify.push({
            tables: [table.tableName],
            reason: 'Only have one column',
            type: 'oneColumn',
          });
        }
      }
      i++;
      this.progress = i / this.tables.length;
    }
  }

  async findCandidateKeys() {
    let i = 0;
    for (const key in this.tables) {
      const table = this.tables[key];
      if (!this.candidateKeyProgress.includes(key) && table.rowCount > 0) {
        try {
          await table.findCandidateKeys();
        } catch (e) {
          this.errorStore.add(`Error finding candidate keys in table: "${table.tableName}"`, e.message);
          return false;
        }
      }
      this.candidateKeyProgress.push(key);
      i++;
      this.progress = i / this.tables.length;
      this.saveData();
    }
    return true;
  }

  async findForeignKeys() {
    let i = 0;

    for (const key in this.tables) {
      const table = this.tables[key];
      if (!this.foreignKeyProgress.includes(key) && table.rowCount > 0) {
        try {
          await table.findForeignKeys(this.tables);
        } catch (e) {
          this.errorStore.add(`Error finding foreign keys in table: "${table.tableName}"`, e.message);
          return false;
        }
      }
      this.foreignKeyProgress.push(key);
      i++;
      this.progress = i / this.tables.length;
      this.saveData();
    }
    return true;
  }

  identifyMissedforeignKeys() {
    let i = 0;
    for (const table of this.tables) {
      for (const fk of table.foreignKeys) {
        const exists = table.foundForeignKeys.some(
          (item) => item.fkTable === fk.fkTable && item.pkTable === fk.pkTable,
        );
        if (!exists) {
        }
      }
      i++;
      this.progress = i / this.tables.length;
    }
  }

  removoeEmptyTables() {
    let i = 0;
    for (const key in this.tables) {
      const table = this.tables[key];
      if (table.rowCount === 0) {
        table.shouldSave = ShouldSave.No;
      }
      i++;
      this.progress = i / this.tables.length;
    }
  }

  findTablesWithNoRelations() {
    let i = 0;
    for (const key in this.tables) {
      const table = this.tables[key];
      if (table.rowCount > 0) {
        if (!table.hasRelations(this.tables, this.ignoreFoundKeys, this.likelinessThreshold)) {
          // table has no relations
          this.tablesToVerify.push({
            reason: 'Table with no relations',
            tables: [table.tableName],
            type: 'single',
          });
        }
      }
      i++;
      this.progress = i / this.tables.length;
    }
  }

  // find disjoint sets.
  async findIslands() {
    // filter out tables that can be removed of other reasons
    let validTables = [];
    for (const table of this.tables) {
      if (
        table.rowCount > 0
        && table.hasRelations(this.tables, this.ignoreFoundKeys, this.likelinessThreshold)
      ) {
        validTables.push(table);
      }
    }

    // find all islands. i.e. Disjount sets
    const sets = [];
    while (validTables.length > 0) {
      // take the first remaining table outside the sets
      const table = validTables[0];
      const newSet: Set<string> = new Set();
      newSet.add(table.tableName);

      // and create a set by following it's links
      this.checkSet(newSet, table, this.tables);

      // Save the set
      sets.push(newSet);

      // Remove the tables that already has been included into a set
      validTables = validTables.filter((item) => !newSet.has(item.tableName));
      // console.log(validTables.map((item) => item.tableName), newSet);
    }

    // find the latgest set
    let largestSet = 0;
    for (let i = 0; i < sets.length; i++) {
      if (sets[i].size > sets[largestSet].size) {
        largestSet = i;
      }
    }

    // Add all smaller sets to the list fo things to verify
    for (let i = 0; i < sets.length; i++) {
      if (sets[i].size < sets[largestSet].size) {
        this.tablesToVerify.push({
          reason: "A set of tables that don't link to the main set",
          tables: [...sets[i]],
          type: 'island',
        });
      }
    }
  }

  // recursive function for creating a set of all tables that link to a specifik table
  checkSet(existing: Set<string>, table: TableStore, tables: TableStore[]) {

    const newSet: Set<TableStore> = new Set();

    const validKeys = [...table.foreignKeys];
    if (!this.ignoreFoundKeys) {
      for (const key of table.foundForeignKeys) {
        if (testKeyLikeliness(key, this.likelinessThreshold)) {
          validKeys.push(key);
        }
      }
    }

    // add the tables that this table are pointing on.
    for (const key of validKeys) {
      // iignore the ones that are already in the set
      if (!existing.has(key.pkTable)) {
        existing.add(key.pkTable);
        const foundTable = tables.find(
          (item: TableStore) => key.pkTable === item.tableName,
        );
        if (foundTable) {
          newSet.add(
            foundTable,
          );
        }
      }
    }

    // add the tables are pointing on table
    const linkingTables = table
      .tablesLinkintToThis(tables, this.ignoreFoundKeys, this.likelinessThreshold);
    for (const fKey of linkingTables) {
      if (!existing.has(fKey.fkTable)) {
        existing.add(fKey.fkTable);
        const foundTable = tables.find((item) => fKey.fkTable === item.tableName);
        if (foundTable) {
          newSet.add(foundTable);
        }
      }
    }

    // Add hte tables connected to the newfound ones
    newSet.forEach((item) => {
      this.checkSet(existing, item, tables);
    }, this);
  }
}
