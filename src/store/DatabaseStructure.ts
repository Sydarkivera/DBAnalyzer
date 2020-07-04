import {
  observable, computed, IReactionDisposer, reaction,
} from 'mobx';
import { v4 as uuid } from 'uuid';
import { testKeyLikeliness } from '../functions/permutations';
import DatabaseManager from '../database';
import ConnectionStore from './Connection';
import TableStore, { ShouldSave } from './Table';

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

  @observable structureStep = 0;

  @observable analysisStep = 0;

  @observable progress = 0;

  @observable isRunning = false;

  @observable autoSave = true;

  @observable ignoreFoundKeys = false;

  @observable likelinessThreshold = 0.8;

  connection: ConnectionStore;

  saveHandler: IReactionDisposer;

  constructor(connection: ConnectionStore, id = '') {
    this.connection = connection;

    // console.log(id);

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
        // console.log("updated", json);
        if (this.autoSave) {
          this.saveData();
        }
      },
    );
  }

  loadSavedData(id: string) {
    const data = fileStore.get(`structure_${id}`);
    // console.log("structure_" + id, data);
    if (data) {
      // this.autoSave = false;
      // this.tableName = data.tableName;
      // this.columns = data.columns;
      // this.rowCount = data.rowCount;
      // this.shouldSave = data.shouldSave;
      // this.candidateKeys = data.candidateKeys;
      // this.foreignKeys = data.foreignKeys;
      // this.autoSave = true;
      this.structureStep = data.structureStep;
      this.analysisStep = data.analysisStep;
      this.tablesToVerify = data.tablesToVerify;
      for (const index in data.tables) {
        // console.log(data.tables[index]);

        this.tables.push(new TableStore(this.connection, data.tables[index]));
      }
      // this.structureStep = 0;
      // this.analysisStep = 0;
      // console.log(this.tables);
    }
    // console.log(this.tables);
  }

  saveData() {
    // console.log("save structure", "structure_" + this.id, this.json);
    // fileStore.set("selected", data);
    // console.log("saveData");
    // console.log(data, this.id);
    try {
      fileStore.set(`structure_${this.id}`, this.json);
    } catch (e) {
      console.error(e);
    }
  }

  @computed get json() {
    return {
      structureStep: this.structureStep,
      analysisStep: this.analysisStep,
      tablesToVerify: this.tablesToVerify,
      tables: this.tables.map((table) => table.id),
    };
  }

  @computed get remaining() {
    return this.tables.length - this.tablesToVerify.length - this.numEmpty;
    // {structure.tables.reduce((reducer, item) => {
    //   if (item.shouldSave && item.rowCount > 0) {
    //     return reducer + 1;
    //   }
    //   return reducer;
    // }, 0)}/{structure.numberOfNonEmptyTables}
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
    if (this.tables.length > 0) {
      return; // TODO: Try updating and only update if change
    }

    const result = await DatabaseManager.fetchAllTables(this.connection.connectionData);
    // console.log(result);

    const tables = [];
    for (const index in result) {
      const row = result[index];
      // console.log(row);

      const table = new TableStore(this.connection);
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
    } else {
      start = this.structureStep - 1;
    }
    this.isRunning = true;
    let a = 0;
    if (start <= a++) {
      await this.loadAllTableColumns();
      this.structureStep += 1;
      console.log('loadAllTableColumns COMPLETE');
    }

    if (start <= a++) {
      await this.findNullColumns();
      this.structureStep += 1;
      console.log('findNullColumns COMPLETE');
    }
    if (start <= a++) {
      await this.findCandidateKeys();
      this.structureStep += 1;
      console.log('findCandidateKeys COMPLETE');
    }
    if (start <= a++) {
      await this.findForeignKeys();
      this.structureStep += 1;
      console.log('findForeignKeys COMPLETE');
    }
    // if (start <= a++) { // optional
    //   await this.identifyMissedforeignKeys();
    //   this.step += 1;
    //   console.log('identifyMissedforeignKeys COMPLETE');
    // }
    // if (start <= a++) {
    // find all tables with no references of foreign keys

    // await structure.findIslands();
    // structure.step += 1;
    // }
    this.isRunning = false;
  }

  async startCulling(start = 0) {
    this.analysisStep = 1;

    let a = 0;

    if (start <= a++) {
      this.removoeEmptyTables();
      this.analysisStep += 1;
      console.log('removoeEmptyTables COMPLETE');
    }

    if (start <= a++) {
      this.findTablesWithOneColumn();
      this.analysisStep += 1;
      console.log('findTablesWithOneColumn COMPLETE');
    }

    if (start <= a++) {
      this.findTablesWithNoRelations();
      this.analysisStep += 1;
      console.log('findTabllesWithNoRelations COMPLETE');
    }

    //  eliminate foreign keys that is defined in the database.

    // eliminate forreign keys that don't have names that match.

    // identify islands
    if (start <= a++) {
      this.findIslands();
      this.analysisStep += 1;
      console.log('findIslands COMPLETE');
    }
  }

  getTable(id: string) {
    // console.log('get table', this.tables);

    return this.tables.find((item) => item.id === id);
  }

  getTableByName(tableName: string) {
    // console.log('get table', this.tables);

    return this.tables.find((item) => item.tableName === tableName);
  }

  async loadAllTableColumns() {
    // this.tableStructureLoaded = 0;
    this.progress = 0;
    let i = 0;
    for (const key in this.tables) {
      const table = this.tables[key];
      if (table.rowCount > 0) {
        await table.fetchColumns();
        // this.tableStructureLoaded += 1;
      }
      i++;
      this.progress = i / this.tables.length;
    }
  }

  async findNullColumns() {
    // this.columnsCheckedFoNull = 0;
    this.progress = 0;
    let i = 0;
    for (const key in this.tables) {
      const table = this.tables[key];
      if (table.rowCount > 0) {
        await table.findNullColumns();
        // this.columnsCheckedFoNull += 1;
      }
      i++;
      this.progress = i / this.tables.length;
    }
  }

  findTablesWithOneColumn() {
    // this.numberOfTablesWithOneColumn = 0;
    let i = 0;
    for (const key in this.tables) {
      const table = this.tables[key];
      if (table.rowCount > 0) {
        if (table.columns.length <= 1) {
          // this.numberOfTablesWithOneColumn += 1;
          this.tablesToVerify.push({
            tables: [table.tableName],
            reason: 'Only have one column',
            type: 'oneColumn',
          });
          // table.shouldSave = false;
        }
        // await table.findForeignKeys();
        // this.numberOfTablesWithOneColumn += 1;
      }
      i++;
      this.progress = i / this.tables.length;
    }
  }

  async findCandidateKeys() {
    // this.tableCandidateKeysLoaded = 0;
    let i = 0;
    for (const key in this.tables) {
      const table = this.tables[key];
      if (table.rowCount > 0) {
        await table.findCandidateKeys();
        // this.tableCandidateKeysLoaded += 1;
      }
      i++;
      this.progress = i / this.tables.length;
    }
  }

  async findForeignKeys() {
    // this.tableForeignKeysLoaded = 0;
    let i = 0;
    for (const key in this.tables) {
      const table = this.tables[key];
      if (table.rowCount > 0) {
        table.foundForeignKeys = [];
        // this.tableForeignKeysLoaded += 1;
      }
    }

    for (const key in this.tables) {
      const table = this.tables[key];
      if (table.rowCount > 0) {
        await table.findForeignKeys(this.tables);
        // this.tableForeignKeysLoaded += 1;
      }
      i++;
      this.progress = i / this.tables.length;
    }
  }

  identifyMissedforeignKeys() {
    let i = 0;
    for (const table of this.tables) {
      for (const fk of table.foreignKeys) {
        const exists = table.foundForeignKeys.some(
          (item) => item.fkTable === fk.fkTable && item.pkTable === fk.pkTable,
        );
        if (!exists) {
          console.log('Missed Foreign Key: ', fk.fkTable, fk.pkTable);
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
      console.log(validTables.map((item) => item.tableName), newSet);
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
    console.log(existing);

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
