/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./electron/main.js":
/*!**************************!*\
  !*** ./electron/main.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var __dirname = "electron";
var electron = __webpack_require__(/*! electron */ "electron");
var isDev = __webpack_require__(/*! electron-is-dev */ "./node_modules/electron-is-dev/index.js");
var log = __webpack_require__(/*! electron-log */ "./node_modules/electron-log/src/index.js");
var fs = __webpack_require__(/*! fs */ "fs");
log.info('Hello, log');
log.warn('Some problem appears');

// require("electron-reload")(__dirname);
// Module to control application life.
var app = electron.app;
// Module to create native browser window.
var BrowserWindow = electron.BrowserWindow;
var path = __webpack_require__(/*! path */ "path");
// const url = require("url");

// const mssql = require("mssql");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;
function createWindow() {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    webPreferences: {
      nodeIntegration: true
    }
  });
  log.info('crating window');

  // and load the index.html of the app.
  if (isDev) {
    mainWindow.loadURL('http://localhost:4000');

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  } else {
    log.info(__dirname, path.join(app.getAppPath(), 'dist/index.html'), app.getAppPath());
    fs.readdir(app.getAppPath(), function (err, files) {
      if (err) {
        return;
      }
      files.forEach(function (file) {
        log.info(file);
      });
    });
    mainWindow.loadURL("file://".concat(path.join(app.getAppPath(), 'dist/index.html')));
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

/***/ }),

/***/ "./node_modules/electron-log/src/core/Logger.js":
/*!******************************************************!*\
  !*** ./node_modules/electron-log/src/core/Logger.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const scopeFactory = __webpack_require__(/*! ./scope */ "./node_modules/electron-log/src/core/scope.js");

/**
 * @property {Function} error
 * @property {Function} warn
 * @property {Function} info
 * @property {Function} verbose
 * @property {Function} debug
 * @property {Function} silly
 */
class Logger {
  static instances = {};

  dependencies = {};
  errorHandler = null;
  eventLogger = null;
  functions = {};
  hooks = [];
  isDev = false;
  levels = null;
  logId = null;
  scope = null;
  transports = {};
  variables = {};

  constructor({
    allowUnknownLevel = false,
    dependencies = {},
    errorHandler,
    eventLogger,
    initializeFn,
    isDev = false,
    levels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'],
    logId,
    transportFactories = {},
    variables,
  } = {}) {
    this.addLevel = this.addLevel.bind(this);
    this.create = this.create.bind(this);
    this.initialize = this.initialize.bind(this);
    this.logData = this.logData.bind(this);
    this.processMessage = this.processMessage.bind(this);

    this.allowUnknownLevel = allowUnknownLevel;
    this.dependencies = dependencies;
    this.initializeFn = initializeFn;
    this.isDev = isDev;
    this.levels = levels;
    this.logId = logId;
    this.transportFactories = transportFactories;
    this.variables = variables || {};
    this.scope = scopeFactory(this);

    for (const name of this.levels) {
      this.addLevel(name, false);
    }
    this.log = this.info;
    this.functions.log = this.log;

    this.errorHandler = errorHandler;
    errorHandler?.setOptions({ ...dependencies, logFn: this.error });

    this.eventLogger = eventLogger;
    eventLogger?.setOptions({ ...dependencies, logger: this });

    for (const [name, factory] of Object.entries(transportFactories)) {
      this.transports[name] = factory(this, dependencies);
    }

    Logger.instances[logId] = this;
  }

  static getInstance({ logId }) {
    return this.instances[logId] || this.instances.default;
  }

  addLevel(level, index = this.levels.length) {
    if (index !== false) {
      this.levels.splice(index, 0, level);
    }

    this[level] = (...args) => this.logData(args, { level });
    this.functions[level] = this[level];
  }

  catchErrors(options) {
    this.processMessage(
      {
        data: ['log.catchErrors is deprecated. Use log.errorHandler instead'],
        level: 'warn',
      },
      { transports: ['console'] },
    );
    return this.errorHandler.startCatching(options);
  }

  create(options) {
    if (typeof options === 'string') {
      options = { logId: options };
    }

    return new Logger({
      dependencies: this.dependencies,
      errorHandler: this.errorHandler,
      initializeFn: this.initializeFn,
      isDev: this.isDev,
      transportFactories: this.transportFactories,
      variables: { ...this.variables },
      ...options,
    });
  }

  compareLevels(passLevel, checkLevel, levels = this.levels) {
    const pass = levels.indexOf(passLevel);
    const check = levels.indexOf(checkLevel);

    if (check === -1 || pass === -1) {
      return true;
    }

    return check <= pass;
  }

  initialize(options = {}) {
    this.initializeFn({ logger: this, ...this.dependencies, ...options });
  }

  logData(data, options = {}) {
    this.processMessage({ data, ...options });
  }

  processMessage(message, { transports = this.transports } = {}) {
    if (message.cmd === 'errorHandler') {
      this.errorHandler.handle(message.error, {
        errorName: message.errorName,
        processType: 'renderer',
        showDialog: Boolean(message.showDialog),
      });
      return;
    }

    let level = message.level;
    if (!this.allowUnknownLevel) {
      level = this.levels.includes(message.level) ? message.level : 'info';
    }

    const normalizedMessage = {
      date: new Date(),
      ...message,
      level,
      variables: {
        ...this.variables,
        ...message.variables,
      },
    };

    for (const [transName, transFn] of this.transportEntries(transports)) {
      if (typeof transFn !== 'function' || transFn.level === false) {
        continue;
      }

      if (!this.compareLevels(transFn.level, message.level)) {
        continue;
      }

      try {
        // eslint-disable-next-line arrow-body-style
        const transformedMsg = this.hooks.reduce((msg, hook) => {
          return msg ? hook(msg, transFn, transName) : msg;
        }, normalizedMessage);

        if (transformedMsg) {
          transFn({ ...transformedMsg, data: [...transformedMsg.data] });
        }
      } catch (e) {
        this.processInternalErrorFn(e);
      }
    }
  }

  processInternalErrorFn(_e) {
    // Do nothing by default
  }

  transportEntries(transports = this.transports) {
    const transportArray = Array.isArray(transports)
      ? transports
      : Object.entries(transports);

    return transportArray
      .map((item) => {
        switch (typeof item) {
          case 'string':
            return this.transports[item] ? [item, this.transports[item]] : null;
          case 'function':
            return [item.name, item];
          default:
            return Array.isArray(item) ? item : null;
        }
      })
      .filter(Boolean);
  }
}

module.exports = Logger;


/***/ }),

/***/ "./node_modules/electron-log/src/core/scope.js":
/*!*****************************************************!*\
  !*** ./node_modules/electron-log/src/core/scope.js ***!
  \*****************************************************/
/***/ ((module) => {

"use strict";


module.exports = scopeFactory;

function scopeFactory(logger) {
  return Object.defineProperties(scope, {
    defaultLabel: { value: '', writable: true },
    labelPadding: { value: true, writable: true },
    maxLabelLength: { value: 0, writable: true },
    labelLength: {
      get() {
        switch (typeof scope.labelPadding) {
          case 'boolean': return scope.labelPadding ? scope.maxLabelLength : 0;
          case 'number': return scope.labelPadding;
          default: return 0;
        }
      },
    },
  });

  function scope(label) {
    scope.maxLabelLength = Math.max(scope.maxLabelLength, label.length);

    const newScope = {};
    for (const level of [...logger.levels, 'log']) {
      newScope[level] = (...d) => logger.logData(d, { level, scope: label });
    }
    return newScope;
  }
}


/***/ }),

/***/ "./node_modules/electron-log/src/index.js":
/*!************************************************!*\
  !*** ./node_modules/electron-log/src/index.js ***!
  \************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


/* eslint-disable global-require */

const isRenderer = typeof process === 'undefined'
  || (process.type === 'renderer' || process.type === 'worker');

const isMain = typeof process === 'object' && process.type === 'browser';

if (isRenderer) {
  // Makes sense when contextIsolation/sandbox disabled
  __webpack_require__(/*! ./renderer/electron-log-preload */ "./node_modules/electron-log/src/renderer/electron-log-preload.js");
  module.exports = __webpack_require__(/*! ./renderer */ "./node_modules/electron-log/src/renderer/index.js");
} else if (isMain) {
  module.exports = __webpack_require__(/*! ./main */ "./node_modules/electron-log/src/main/index.js");
} else {
  module.exports = __webpack_require__(/*! ./node */ "./node_modules/electron-log/src/node/index.js");
}


/***/ }),

/***/ "./node_modules/electron-log/src/main/ElectronExternalApi.js":
/*!*******************************************************************!*\
  !*** ./node_modules/electron-log/src/main/ElectronExternalApi.js ***!
  \*******************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const path = __webpack_require__(/*! path */ "path");
const NodeExternalApi = __webpack_require__(/*! ../node/NodeExternalApi */ "./node_modules/electron-log/src/node/NodeExternalApi.js");

class ElectronExternalApi extends NodeExternalApi {
  /**
   * @type {typeof Electron}
   */
  electron = undefined;

  /**
   * @param {object} options
   * @param {typeof Electron} [options.electron]
   */
  constructor({ electron } = {}) {
    super();
    this.electron = electron;
  }

  getAppName() {
    let appName;
    try {
      appName = this.appName
        || this.electron.app?.name
        || this.electron.app?.getName();
    } catch {
      // fallback to default value below
    }
    return appName || super.getAppName();
  }

  getAppUserDataPath(appName) {
    return this.getPath('userData') || super.getAppUserDataPath(appName);
  }

  getAppVersion() {
    let appVersion;
    try {
      appVersion = this.electron.app?.getVersion();
    } catch {
      // fallback to default value below
    }
    return appVersion || super.getAppVersion();
  }

  getElectronLogPath() {
    return this.getPath('logs') || super.getElectronLogPath();
  }

  /**
   * @private
   * @param {any} name
   * @returns {string|undefined}
   */
  getPath(name) {
    try {
      return this.electron.app?.getPath(name);
    } catch {
      return undefined;
    }
  }

  getVersions() {
    return {
      app: `${this.getAppName()} ${this.getAppVersion()}`,
      electron: `Electron ${process.versions.electron}`,
      os: this.getOsVersion(),
    };
  }

  getSystemPathAppData() {
    return this.getPath('appData') || super.getSystemPathAppData();
  }

  isDev() {
    if (this.electron.app?.isPackaged !== undefined) {
      return !this.electron.app.isPackaged;
    }

    if (typeof process.execPath === 'string') {
      const execFileName = path.basename(process.execPath).toLowerCase();
      return execFileName.startsWith('electron');
    }

    return super.isDev();
  }

  onAppEvent(eventName, handler) {
    this.electron.app?.on(eventName, handler);

    return () => {
      this.electron.app?.off(eventName, handler);
    };
  }

  onAppReady(handler) {
    if (this.electron.app?.isReady()) {
      handler();
    } else if (this.electron.app?.once) {
      this.electron.app?.once('ready', handler);
    } else {
      handler();
    }
  }

  onEveryWebContentsEvent(eventName, handler) {
    this.electron.webContents?.getAllWebContents()?.forEach((webContents) => {
      webContents.on(eventName, handler);
    });

    this.electron.app?.on('web-contents-created', onWebContentsCreated);

    return () => {
      this.electron.webContents?.getAllWebContents().forEach((webContents) => {
        webContents.off(eventName, handler);
      });

      this.electron.app?.off('web-contents-created', onWebContentsCreated);
    };

    function onWebContentsCreated(_, webContents) {
      webContents.on(eventName, handler);
    }
  }

  /**
   * Listen to async messages sent from opposite process
   * @param {string} channel
   * @param {function} listener
   */
  onIpc(channel, listener) {
    this.electron.ipcMain?.on(channel, listener);
  }

  onIpcInvoke(channel, listener) {
    this.electron.ipcMain?.handle?.(channel, listener);
  }

  /**
   * @param {string} url
   * @param {Function} [logFunction]
   */
  openUrl(url, logFunction = console.error) { // eslint-disable-line no-console
    this.electron.shell?.openExternal(url).catch(logFunction);
  }

  setPreloadFileForSessions({
    filePath,
    includeFutureSession = true,
    getSessions = () => [this.electron.session?.defaultSession],
  }) {
    for (const session of getSessions().filter(Boolean)) {
      setPreload(session);
    }

    if (includeFutureSession) {
      this.onAppEvent('session-created', (session) => {
        setPreload(session);
      });
    }

    /**
     * @param {Session} session
     */
    function setPreload(session) {
      session.setPreloads([...session.getPreloads(), filePath]);
    }
  }

  /**
   * Sent a message to opposite process
   * @param {string} channel
   * @param {any} message
   */
  sendIpc(channel, message) {
    this.electron.BrowserWindow?.getAllWindows()?.forEach((wnd) => {
      if (wnd.webContents?.isDestroyed() === false) {
        wnd.webContents.send(channel, message);
      }
    });
  }

  showErrorBox(title, message) {
    this.electron.dialog?.showErrorBox(title, message);
  }
}

module.exports = ElectronExternalApi;


/***/ }),

/***/ "./node_modules/electron-log/src/main/index.js":
/*!*****************************************************!*\
  !*** ./node_modules/electron-log/src/main/index.js ***!
  \*****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const electron = __webpack_require__(/*! electron */ "electron");
const ElectronExternalApi = __webpack_require__(/*! ./ElectronExternalApi */ "./node_modules/electron-log/src/main/ElectronExternalApi.js");
const { initialize } = __webpack_require__(/*! ./initialize */ "./node_modules/electron-log/src/main/initialize.js");
const createDefaultLogger = __webpack_require__(/*! ../node/createDefaultLogger */ "./node_modules/electron-log/src/node/createDefaultLogger.js");

const externalApi = new ElectronExternalApi({ electron });
const defaultLogger = createDefaultLogger({
  dependencies: { externalApi },
  initializeFn: initialize,
});

module.exports = defaultLogger;

externalApi.onIpc('__ELECTRON_LOG__', (_, message) => {
  if (message.scope) {
    defaultLogger.Logger.getInstance(message).scope(message.scope);
  }

  const date = new Date(message.date);
  processMessage({
    ...message,
    date: date.getTime() ? date : new Date(),
  });
});

externalApi.onIpcInvoke('__ELECTRON_LOG__', (_, { cmd = '', logId }) => {
  switch (cmd) {
    case 'getOptions': {
      const logger = defaultLogger.Logger.getInstance({ logId });
      return {
        levels: logger.levels,
        logId,
      };
    }

    default: {
      processMessage({ data: [`Unknown cmd '${cmd}'`], level: 'error' });
      return {};
    }
  }
});

function processMessage(message) {
  defaultLogger.Logger.getInstance(message)?.processMessage(message);
}


/***/ }),

/***/ "./node_modules/electron-log/src/main/initialize.js":
/*!**********************************************************!*\
  !*** ./node_modules/electron-log/src/main/initialize.js ***!
  \**********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
var __dirname = "node_modules/electron-log/src/main";


const fs = __webpack_require__(/*! fs */ "fs");
const os = __webpack_require__(/*! os */ "os");
const path = __webpack_require__(/*! path */ "path");
const preloadInitializeFn = __webpack_require__(/*! ../renderer/electron-log-preload */ "./node_modules/electron-log/src/renderer/electron-log-preload.js");

module.exports = {
  initialize({
    externalApi,
    getSessions,
    includeFutureSession,
    logger,
    preload = true,
    spyRendererConsole = false,
  }) {
    externalApi.onAppReady(() => {
      try {
        if (preload) {
          initializePreload({
            externalApi,
            getSessions,
            includeFutureSession,
            preloadOption: preload,
          });
        }

        if (spyRendererConsole) {
          initializeSpyRendererConsole({ externalApi, logger });
        }
      } catch (err) {
        logger.warn(err);
      }
    });
  },
};

function initializePreload({
  externalApi,
  getSessions,
  includeFutureSession,
  preloadOption,
}) {
  let preloadPath = typeof preloadOption === 'string'
    ? preloadOption
    : undefined;

  try {
    preloadPath = path.resolve(
      __dirname,
      '../renderer/electron-log-preload.js',
    );
  } catch {
    // Ignore, the file is bundled to ESM
  }

  if (!preloadPath || !fs.existsSync(preloadPath)) {
    preloadPath = path.join(
      externalApi.getAppUserDataPath() || os.tmpdir(),
      'electron-log-preload.js',
    );
    const preloadCode = `
      try {
        (${preloadInitializeFn.toString()})(require('electron'));
      } catch(e) {
        console.error(e);
      }
    `;
    fs.writeFileSync(preloadPath, preloadCode, 'utf8');
  }

  externalApi.setPreloadFileForSessions({
    filePath: preloadPath,
    includeFutureSession,
    getSessions,
  });
}

function initializeSpyRendererConsole({ externalApi, logger }) {
  const levels = ['verbose', 'info', 'warning', 'error'];
  externalApi.onEveryWebContentsEvent(
    'console-message',
    (event, level, message) => {
      logger.processMessage({
        data: [message],
        level: levels[level],
        variables: { processType: 'renderer' },
      });
    },
  );
}


/***/ }),

/***/ "./node_modules/electron-log/src/node/ErrorHandler.js":
/*!************************************************************!*\
  !*** ./node_modules/electron-log/src/node/ErrorHandler.js ***!
  \************************************************************/
/***/ ((module) => {

"use strict";


class ErrorHandler {
  externalApi = undefined;
  isActive = false;
  logFn = undefined;
  onError = undefined;
  showDialog = true;

  constructor({
    externalApi,
    logFn = undefined,
    onError = undefined,
    showDialog = undefined,
  } = {}) {
    this.createIssue = this.createIssue.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleRejection = this.handleRejection.bind(this);
    this.setOptions({ externalApi, logFn, onError, showDialog });
    this.startCatching = this.startCatching.bind(this);
    this.stopCatching = this.stopCatching.bind(this);
  }

  handle(error, {
    logFn = this.logFn,
    onError = this.onError,
    processType = 'browser',
    showDialog = this.showDialog,
    errorName = '',
  } = {}) {
    error = normalizeError(error);

    try {
      if (typeof onError === 'function') {
        const versions = this.externalApi?.getVersions() || {};
        const createIssue = this.createIssue;
        const result = onError({
          createIssue,
          error,
          errorName,
          processType,
          versions,
        });
        if (result === false) {
          return;
        }
      }

      errorName ? logFn(errorName, error) : logFn(error);

      if (showDialog && !errorName.includes('rejection') && this.externalApi) {
        this.externalApi.showErrorBox(
          `A JavaScript error occurred in the ${processType} process`,
          error.stack,
        );
      }
    } catch {
      console.error(error); // eslint-disable-line no-console
    }
  }

  setOptions({ externalApi, logFn, onError, showDialog }) {
    if (typeof externalApi === 'object') {
      this.externalApi = externalApi;
    }

    if (typeof logFn === 'function') {
      this.logFn = logFn;
    }

    if (typeof onError === 'function') {
      this.onError = onError;
    }

    if (typeof showDialog === 'boolean') {
      this.showDialog = showDialog;
    }
  }

  startCatching({ onError, showDialog } = {}) {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.setOptions({ onError, showDialog });
    process.on('uncaughtException', this.handleError);
    process.on('unhandledRejection', this.handleRejection);
  }

  stopCatching() {
    this.isActive = false;
    process.removeListener('uncaughtException', this.handleError);
    process.removeListener('unhandledRejection', this.handleRejection);
  }

  createIssue(pageUrl, queryParams) {
    this.externalApi?.openUrl(
      `${pageUrl}?${new URLSearchParams(queryParams).toString()}`,
    );
  }

  handleError(error) {
    this.handle(error, { errorName: 'Unhandled' });
  }

  handleRejection(reason) {
    const error = reason instanceof Error
      ? reason
      : new Error(JSON.stringify(reason));
    this.handle(error, { errorName: 'Unhandled rejection' });
  }
}

function normalizeError(e) {
  if (e instanceof Error) {
    return e;
  }

  if (e && typeof e === 'object') {
    if (e.message) {
      return Object.assign(new Error(e.message), e);
    }
    try {
      return new Error(JSON.stringify(e));
    } catch (serErr) {
      return new Error(`Couldn't normalize error ${String(e)}: ${serErr}`);
    }
  }

  return new Error(`Can't normalize error ${String(e)}`);
}

module.exports = ErrorHandler;


/***/ }),

/***/ "./node_modules/electron-log/src/node/EventLogger.js":
/*!***********************************************************!*\
  !*** ./node_modules/electron-log/src/node/EventLogger.js ***!
  \***********************************************************/
/***/ ((module) => {

"use strict";


class EventLogger {
  disposers = [];
  format = '{eventSource}#{eventName}:';
  formatters = {
    app: {
      'certificate-error': ({ args }) => {
        return this.arrayToObject(args.slice(1, 4), [
          'url',
          'error',
          'certificate',
        ]);
      },
      'child-process-gone': ({ args }) => {
        return args.length === 1 ? args[0] : args;
      },
      'render-process-gone': ({ args: [webContents, details] }) => {
        return details && typeof details === 'object'
          ? { ...details, ...this.getWebContentsDetails(webContents) }
          : [];
      },
    },

    webContents: {
      'console-message': ({ args: [level, message, line, sourceId] }) => {
        // 0: debug, 1: info, 2: warning, 3: error
        if (level < 3) {
          return undefined;
        }

        return { message, source: `${sourceId}:${line}` };
      },
      'did-fail-load': ({ args }) => {
        return this.arrayToObject(args, [
          'errorCode',
          'errorDescription',
          'validatedURL',
          'isMainFrame',
          'frameProcessId',
          'frameRoutingId',
        ]);
      },
      'did-fail-provisional-load': ({ args }) => {
        return this.arrayToObject(args, [
          'errorCode',
          'errorDescription',
          'validatedURL',
          'isMainFrame',
          'frameProcessId',
          'frameRoutingId',
        ]);
      },
      'plugin-crashed': ({ args }) => {
        return this.arrayToObject(args, ['name', 'version']);
      },
      'preload-error': ({ args }) => {
        return this.arrayToObject(args, ['preloadPath', 'error']);
      },
    },
  };

  events = {
    app: {
      'certificate-error': true,
      'child-process-gone': true,
      'render-process-gone': true,
    },

    webContents: {
      // 'console-message': true,
      'did-fail-load': true,
      'did-fail-provisional-load': true,
      'plugin-crashed': true,
      'preload-error': true,
      'unresponsive': true,
    },
  };

  externalApi = undefined;
  level = 'error';
  scope = '';

  constructor(options = {}) {
    this.setOptions(options);
  }

  setOptions({
    events,
    externalApi,
    level,
    logger,
    format,
    formatters,
    scope,
  }) {
    if (typeof events === 'object') {
      this.events = events;
    }

    if (typeof externalApi === 'object') {
      this.externalApi = externalApi;
    }

    if (typeof level === 'string') {
      this.level = level;
    }

    if (typeof logger === 'object') {
      this.logger = logger;
    }

    if (typeof format === 'string' || typeof format === 'function') {
      this.format = format;
    }

    if (typeof formatters === 'object') {
      this.formatters = formatters;
    }

    if (typeof scope === 'string') {
      this.scope = scope;
    }
  }

  startLogging(options = {}) {
    this.setOptions(options);

    this.disposeListeners();

    for (const eventName of this.getEventNames(this.events.app)) {
      this.disposers.push(
        this.externalApi.onAppEvent(eventName, (...handlerArgs) => {
          this.handleEvent({ eventSource: 'app', eventName, handlerArgs });
        }),
      );
    }

    for (const eventName of this.getEventNames(this.events.webContents)) {
      this.disposers.push(
        this.externalApi.onEveryWebContentsEvent(
          eventName,
          (...handlerArgs) => {
            this.handleEvent(
              { eventSource: 'webContents', eventName, handlerArgs },
            );
          },
        ),
      );
    }
  }

  stopLogging() {
    this.disposeListeners();
  }

  arrayToObject(array, fieldNames) {
    const obj = {};

    fieldNames.forEach((fieldName, index) => {
      obj[fieldName] = array[index];
    });

    if (array.length > fieldNames.length) {
      obj.unknownArgs = array.slice(fieldNames.length);
    }

    return obj;
  }

  disposeListeners() {
    this.disposers.forEach((disposer) => disposer());
    this.disposers = [];
  }

  formatEventLog({ eventName, eventSource, handlerArgs }) {
    const [event, ...args] = handlerArgs;
    if (typeof this.format === 'function') {
      return this.format({ args, event, eventName, eventSource });
    }

    const formatter = this.formatters[eventSource]?.[eventName];
    let formattedArgs = args;
    if (typeof formatter === 'function') {
      formattedArgs = formatter({ args, event, eventName, eventSource });
    }

    if (!formattedArgs) {
      return undefined;
    }

    const eventData = {};

    if (Array.isArray(formattedArgs)) {
      eventData.args = formattedArgs;
    } else if (typeof formattedArgs === 'object') {
      Object.assign(eventData, formattedArgs);
    }

    if (eventSource === 'webContents') {
      Object.assign(eventData, this.getWebContentsDetails(event?.sender));
    }

    const title = this.format
      .replace('{eventSource}', eventSource === 'app' ? 'App' : 'WebContents')
      .replace('{eventName}', eventName);

    return [title, eventData];
  }

  getEventNames(eventMap) {
    if (!eventMap || typeof eventMap !== 'object') {
      return [];
    }

    return Object.entries(eventMap)
      .filter(([_, listen]) => listen)
      .map(([eventName]) => eventName);
  }

  getWebContentsDetails(webContents) {
    if (!webContents?.loadURL) {
      return {};
    }

    try {
      return {
        webContents: {
          id: webContents.id,
          url: webContents.getURL(),
        },
      };
    } catch {
      return {};
    }
  }

  handleEvent({ eventName, eventSource, handlerArgs }) {
    const log = this.formatEventLog({ eventName, eventSource, handlerArgs });
    if (log) {
      const logFns = this.scope ? this.logger.scope(this.scope) : this.logger;
      logFns?.[this.level]?.(...log);
    }
  }
}

module.exports = EventLogger;


/***/ }),

/***/ "./node_modules/electron-log/src/node/NodeExternalApi.js":
/*!***************************************************************!*\
  !*** ./node_modules/electron-log/src/node/NodeExternalApi.js ***!
  \***************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


/* eslint-disable no-unused-vars */

const childProcess = __webpack_require__(/*! child_process */ "child_process");
const os = __webpack_require__(/*! os */ "os");
const path = __webpack_require__(/*! path */ "path");
const packageJson = __webpack_require__(/*! ./packageJson */ "./node_modules/electron-log/src/node/packageJson.js");

class NodeExternalApi {
  appName = undefined;
  appPackageJson = undefined;
  platform = process.platform;

  getAppLogPath(appName = this.getAppName()) {
    if (this.platform === 'darwin') {
      return path.join(this.getSystemPathHome(), 'Library/Logs', appName);
    }

    return path.join(this.getAppUserDataPath(appName), 'logs');
  }

  getAppName() {
    const appName = this.appName || this.getAppPackageJson()?.name;
    if (!appName) {
      throw new Error(
        'electron-log can\'t determine the app name. It tried these methods:\n'
        + '1. Use `electron.app.name`\n'
        + '2. Use productName or name from the nearest package.json`\n'
        + 'You can also set it through log.transports.file.setAppName()',
      );
    }

    return appName;
  }

  /**
   * @private
   * @returns {undefined}
   */
  getAppPackageJson() {
    if (typeof this.appPackageJson !== 'object') {
      this.appPackageJson = packageJson.findAndReadPackageJson();
    }

    return this.appPackageJson;
  }

  getAppUserDataPath(appName = this.getAppName()) {
    return appName
      ? path.join(this.getSystemPathAppData(), appName)
      : undefined;
  }

  getAppVersion() {
    return this.getAppPackageJson()?.version;
  }

  getElectronLogPath() {
    return this.getAppLogPath();
  }

  getMacOsVersion() {
    const release = Number(os.release().split('.')[0]);
    if (release <= 19) {
      return `10.${release - 4}`;
    }

    return release - 9;
  }

  /**
   * @protected
   * @returns {string}
   */
  getOsVersion() {
    let osName = os.type().replace('_', ' ');
    let osVersion = os.release();

    if (osName === 'Darwin') {
      osName = 'macOS';
      osVersion = this.getMacOsVersion();
    }

    return `${osName} ${osVersion}`;
  }

  /**
   * @return {PathVariables}
   */
  getPathVariables() {
    const appName = this.getAppName();
    const appVersion = this.getAppVersion();

    const self = this;

    return {
      appData: this.getSystemPathAppData(),
      appName,
      appVersion,
      get electronDefaultDir() {
        return self.getElectronLogPath();
      },
      home: this.getSystemPathHome(),
      libraryDefaultDir: this.getAppLogPath(appName),
      libraryTemplate: this.getAppLogPath('{appName}'),
      temp: this.getSystemPathTemp(),
      userData: this.getAppUserDataPath(appName),
    };
  }

  getSystemPathAppData() {
    const home = this.getSystemPathHome();

    switch (this.platform) {
      case 'darwin': {
        return path.join(home, 'Library/Application Support');
      }

      case 'win32': {
        return process.env.APPDATA || path.join(home, 'AppData/Roaming');
      }

      default: {
        return process.env.XDG_CONFIG_HOME || path.join(home, '.config');
      }
    }
  }

  getSystemPathHome() {
    return os.homedir?.() || process.env.HOME;
  }

  getSystemPathTemp() {
    return os.tmpdir();
  }

  getVersions() {
    return {
      app: `${this.getAppName()} ${this.getAppVersion()}`,
      electron: undefined,
      os: this.getOsVersion(),
    };
  }

  isDev() {
    return  true
      || 0;
  }

  isElectron() {
    return Boolean(process.versions.electron);
  }

  onAppEvent(_eventName, _handler) {
    // Ignored in node.js
  }

  onAppReady(handler) {
    handler();
  }

  onEveryWebContentsEvent(eventName, handler) {
    // Ignored in node.js
  }

  /**
   * Listen to async messages sent from opposite process
   * @param {string} channel
   * @param {function} listener
   */
  onIpc(channel, listener) {
    // Ignored in node.js
  }

  onIpcInvoke(channel, listener) {
    // Ignored in node.js
  }

  /**
   * @param {string} url
   * @param {Function} [logFunction]
   */
  openUrl(url, logFunction = console.error) { // eslint-disable-line no-console
    const startMap = { darwin: 'open', win32: 'start', linux: 'xdg-open' };
    const start = startMap[process.platform] || 'xdg-open';
    childProcess.exec(`${start} ${url}`, {}, (err) => {
      if (err) {
        logFunction(err);
      }
    });
  }

  setAppName(appName) {
    this.appName = appName;
  }

  setPlatform(platform) {
    this.platform = platform;
  }

  setPreloadFileForSessions({
    filePath, // eslint-disable-line no-unused-vars
    includeFutureSession = true, // eslint-disable-line no-unused-vars
    getSessions = () => [], // eslint-disable-line no-unused-vars
  }) {
    // Ignored in node.js
  }

  /**
   * Sent a message to opposite process
   * @param {string} channel
   * @param {any} message
   */
  sendIpc(channel, message) {
    // Ignored in node.js
  }

  showErrorBox(title, message) {
    // Ignored in node.js
  }
}

module.exports = NodeExternalApi;


/***/ }),

/***/ "./node_modules/electron-log/src/node/createDefaultLogger.js":
/*!*******************************************************************!*\
  !*** ./node_modules/electron-log/src/node/createDefaultLogger.js ***!
  \*******************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const Logger = __webpack_require__(/*! ../core/Logger */ "./node_modules/electron-log/src/core/Logger.js");
const ErrorHandler = __webpack_require__(/*! ./ErrorHandler */ "./node_modules/electron-log/src/node/ErrorHandler.js");
const EventLogger = __webpack_require__(/*! ./EventLogger */ "./node_modules/electron-log/src/node/EventLogger.js");
const transportConsole = __webpack_require__(/*! ./transports/console */ "./node_modules/electron-log/src/node/transports/console.js");
const transportFile = __webpack_require__(/*! ./transports/file */ "./node_modules/electron-log/src/node/transports/file/index.js");
const transportIpc = __webpack_require__(/*! ./transports/ipc */ "./node_modules/electron-log/src/node/transports/ipc.js");
const transportRemote = __webpack_require__(/*! ./transports/remote */ "./node_modules/electron-log/src/node/transports/remote.js");

module.exports = createDefaultLogger;

function createDefaultLogger({ dependencies, initializeFn }) {
  const defaultLogger = new Logger({
    dependencies,
    errorHandler: new ErrorHandler(),
    eventLogger: new EventLogger(),
    initializeFn,
    isDev: dependencies.externalApi?.isDev(),
    logId: 'default',
    transportFactories: {
      console: transportConsole,
      file: transportFile,
      ipc: transportIpc,
      remote: transportRemote,
    },
    variables: {
      processType: 'main',
    },
  });

  defaultLogger.default = defaultLogger;
  defaultLogger.Logger = Logger;

  defaultLogger.processInternalErrorFn = (e) => {
    defaultLogger.transports.console.writeFn({
      message: {
        data: ['Unhandled electron-log error', e],
        level: 'error',
      },
    });
  };

  return defaultLogger;
}


/***/ }),

/***/ "./node_modules/electron-log/src/node/index.js":
/*!*****************************************************!*\
  !*** ./node_modules/electron-log/src/node/index.js ***!
  \*****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const NodeExternalApi = __webpack_require__(/*! ./NodeExternalApi */ "./node_modules/electron-log/src/node/NodeExternalApi.js");
const createDefaultLogger = __webpack_require__(/*! ./createDefaultLogger */ "./node_modules/electron-log/src/node/createDefaultLogger.js");

const externalApi = new NodeExternalApi();

const defaultLogger = createDefaultLogger({
  dependencies: { externalApi },
});

module.exports = defaultLogger;


/***/ }),

/***/ "./node_modules/electron-log/src/node/packageJson.js":
/*!***********************************************************!*\
  !*** ./node_modules/electron-log/src/node/packageJson.js ***!
  \***********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(/*! fs */ "fs");
const path = __webpack_require__(/*! path */ "path");

module.exports = {
  findAndReadPackageJson,
  tryReadJsonAt,
};

/**
 * @return {{ name?: string, version?: string}}
 */
function findAndReadPackageJson() {
  return tryReadJsonAt(getMainModulePath())
    || tryReadJsonAt(extractPathFromArgs())
    || tryReadJsonAt(process.resourcesPath, 'app.asar')
    || tryReadJsonAt(process.resourcesPath, 'app')
    || tryReadJsonAt(process.cwd())
    || { name: undefined, version: undefined };
}

/**
 * @param {...string} searchPaths
 * @return {{ name?: string, version?: string } | undefined}
 */
function tryReadJsonAt(...searchPaths) {
  if (!searchPaths[0]) {
    return undefined;
  }

  try {
    const searchPath = path.join(...searchPaths);
    const fileName = findUp('package.json', searchPath);
    if (!fileName) {
      return undefined;
    }

    const json = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    const name = json?.productName || json?.name;
    if (!name || name.toLowerCase() === 'electron') {
      return undefined;
    }

    if (name) {
      return { name, version: json?.version };
    }

    return undefined;
  } catch (e) {
    return undefined;
  }
}

/**
 * @param {string} fileName
 * @param {string} [cwd]
 * @return {string | null}
 */
function findUp(fileName, cwd) {
  let currentPath = cwd;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const parsedPath = path.parse(currentPath);
    const root = parsedPath.root;
    const dir = parsedPath.dir;

    if (fs.existsSync(path.join(currentPath, fileName))) {
      return path.resolve(path.join(currentPath, fileName));
    }

    if (currentPath === root) {
      return null;
    }

    currentPath = dir;
  }
}

/**
 * Get app path from --user-data-dir cmd arg, passed to a renderer process
 * @return {string|null}
 */
function extractPathFromArgs() {
  const matchedArgs = process.argv.filter((arg) => {
    return arg.indexOf('--user-data-dir=') === 0;
  });

  if (matchedArgs.length === 0 || typeof matchedArgs[0] !== 'string') {
    return null;
  }

  const userDataDir = matchedArgs[0];
  return userDataDir.replace('--user-data-dir=', '');
}

function getMainModulePath() {
  try {
    // Requires isn't available in ESM
    return __webpack_require__.c[__webpack_require__.s]?.filename;
  } catch {
    return undefined;
  }
}


/***/ }),

/***/ "./node_modules/electron-log/src/node/transforms/format.js":
/*!*****************************************************************!*\
  !*** ./node_modules/electron-log/src/node/transforms/format.js ***!
  \*****************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const { transform } = __webpack_require__(/*! ./transform */ "./node_modules/electron-log/src/node/transforms/transform.js");

module.exports = {
  concatFirstStringElements,
  formatScope,
  formatText,
  formatVariables,
  timeZoneFromOffset,

  format({ message, logger, transport, data = message?.data }) {
    switch (typeof transport.format) {
      case 'string': {
        return transform({
          message,
          logger,
          transforms: [formatVariables, formatScope, formatText],
          transport,
          initialData: [transport.format, ...data],
        });
      }

      case 'function': {
        return transport.format({
          data,
          level: message?.level || 'info',
          logger,
          message,
          transport,
        });
      }

      default: {
        return data;
      }
    }
  },
};

/**
 * The first argument of console.log may contain a template. In the library
 * the first element is a string related to transports.console.format. So
 * this function concatenates first two elements to make templates like %d
 * work
 * @param {*[]} data
 * @return {*[]}
 */
function concatFirstStringElements({ data }) {
  if (typeof data[0] !== 'string' || typeof data[1] !== 'string') {
    return data;
  }

  if (data[0].match(/%[1cdfiOos]/)) {
    return data;
  }

  return [`${data[0]} ${data[1]}`, ...data.slice(2)];
}

function timeZoneFromOffset(minutesOffset) {
  const minutesPositive = Math.abs(minutesOffset);
  const sign = minutesOffset >= 0 ? '-' : '+';
  const hours = Math.floor(minutesPositive / 60).toString().padStart(2, '0');
  const minutes = (minutesPositive % 60).toString().padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
}

function formatScope({ data, logger, message }) {
  const { defaultLabel, labelLength } = logger?.scope || {};
  const template = data[0];
  let label = message.scope;

  if (!label) {
    label = defaultLabel;
  }

  let scopeText;
  if (label === '') {
    scopeText = labelLength > 0 ? ''.padEnd(labelLength + 3) : '';
  } else if (typeof label === 'string') {
    scopeText = ` (${label})`.padEnd(labelLength + 3);
  } else {
    scopeText = '';
  }

  data[0] = template.replace('{scope}', scopeText);
  return data;
}

function formatVariables({ data, message }) {
  let template = data[0];
  if (typeof template !== 'string') {
    return data;
  }

  // Add additional space to the end of {level}] template to align messages
  template = template.replace('{level}]', `${message.level}]`.padEnd(6, ' '));

  const date = message.date || new Date();
  data[0] = template
    .replace(/\{(\w+)}/g, (substring, name) => {
      switch (name) {
        case 'level': return message.level || 'info';
        case 'logId': return message.logId;

        case 'y': return date.getFullYear().toString(10);
        case 'm': return (date.getMonth() + 1).toString(10).padStart(2, '0');
        case 'd': return date.getDate().toString(10).padStart(2, '0');
        case 'h': return date.getHours().toString(10).padStart(2, '0');
        case 'i': return date.getMinutes().toString(10).padStart(2, '0');
        case 's': return date.getSeconds().toString(10).padStart(2, '0');
        case 'ms': return date.getMilliseconds().toString(10).padStart(3, '0');
        case 'z': return timeZoneFromOffset(date.getTimezoneOffset());
        case 'iso': return date.toISOString();

        default: {
          return message.variables?.[name] || substring;
        }
      }
    })
    .trim();

  return data;
}

function formatText({ data }) {
  const template = data[0];
  if (typeof template !== 'string') {
    return data;
  }

  const textTplPosition = template.lastIndexOf('{text}');
  if (textTplPosition === template.length - 6) {
    data[0] = template.replace(/\s?{text}/, '');
    if (data[0] === '') {
      data.shift();
    }

    return data;
  }

  const templatePieces = template.split('{text}');
  let result = [];

  if (templatePieces[0] !== '') {
    result.push(templatePieces[0]);
  }

  result = result.concat(data.slice(1));

  if (templatePieces[1] !== '') {
    result.push(templatePieces[1]);
  }

  return result;
}


/***/ }),

/***/ "./node_modules/electron-log/src/node/transforms/object.js":
/*!*****************************************************************!*\
  !*** ./node_modules/electron-log/src/node/transforms/object.js ***!
  \*****************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const util = __webpack_require__(/*! util */ "util");

module.exports = {
  serialize,

  maxDepth({ data, transport, depth = transport?.depth ?? 6 }) {
    if (!data) {
      return data;
    }

    if (depth < 1) {
      if (Array.isArray(data)) return '[array]';
      if (typeof data === 'object' && data) return '[object]';

      return data;
    }

    if (Array.isArray(data)) {
      return data.map((child) => module.exports.maxDepth({
        data: child,
        depth: depth - 1,
      }));
    }

    if (typeof data !== 'object') {
      return data;
    }

    if (data && typeof data.toISOString === 'function') {
      return data;
    }

    // noinspection PointlessBooleanExpressionJS
    if (data === null) {
      return null;
    }

    if (data instanceof Error) {
      return data;
    }

    const newJson = {};
    for (const i in data) {
      if (!Object.prototype.hasOwnProperty.call(data, i)) continue;
      newJson[i] = module.exports.maxDepth({
        data: data[i],
        depth: depth - 1,
      });
    }

    return newJson;
  },

  toJSON({ data }) {
    return JSON.parse(JSON.stringify(data, createSerializer()));
  },

  toString({ data, transport }) {
    const inspectOptions = transport?.inspectOptions || {};

    const simplifiedData = data.map((item) => {
      if (item === undefined) {
        return undefined;
      }

      try {
        const str = JSON.stringify(item, createSerializer(), '  ');
        return str === undefined ? undefined : JSON.parse(str);
      } catch (e) {
        // There are some rare cases when an item can't be simplified.
        // In that case, it's fine to pass it to util.format directly.
        return item;
      }
    });

    return util.formatWithOptions(inspectOptions, ...simplifiedData);
  },
};

/**
 * @param {object} options?
 * @param {boolean} options.serializeMapAndSet?
 * @return {function}
 */
function createSerializer(options = {}) {
  const seen = new WeakSet();

  return function (key, value) {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return undefined;
      }

      seen.add(value);
    }

    return serialize(key, value, options);
  };
}

/**
 * @param {string} key
 * @param {any} value
 * @param {object} options?
 * @return {any}
 */
function serialize(key, value, options = {}) {
  const serializeMapAndSet = options?.serializeMapAndSet !== false;

  if (value instanceof Error) {
    return value.stack;
  }

  if (!value) {
    return value;
  }

  if (typeof value === 'function') {
    return `[function] ${value.toString()}`;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (serializeMapAndSet && value instanceof Map && Object.fromEntries) {
    return Object.fromEntries(value);
  }

  if (serializeMapAndSet && value instanceof Set && Array.from) {
    return Array.from(value);
  }

  return value;
}


/***/ }),

/***/ "./node_modules/electron-log/src/node/transforms/style.js":
/*!****************************************************************!*\
  !*** ./node_modules/electron-log/src/node/transforms/style.js ***!
  \****************************************************************/
/***/ ((module) => {

"use strict";


module.exports = {
  transformStyles,

  applyAnsiStyles({ data }) {
    return transformStyles(data, styleToAnsi, resetAnsiStyle);
  },

  removeStyles({ data }) {
    return transformStyles(data, () => '');
  },
};

const ANSI_COLORS = {
  unset: '\x1b[0m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function styleToAnsi(style) {
  const color = style.replace(/color:\s*(\w+).*/, '$1').toLowerCase();
  return ANSI_COLORS[color] || '';
}

function resetAnsiStyle(string) {
  return string + ANSI_COLORS.unset;
}

function transformStyles(data, onStyleFound, onStyleApplied) {
  const foundStyles = {};

  return data.reduce((result, item, index, array) => {
    if (foundStyles[index]) {
      return result;
    }

    if (typeof item === 'string') {
      let valueIndex = index;
      let styleApplied = false;

      item = item.replace(/%[1cdfiOos]/g, (match) => {
        valueIndex += 1;

        if (match !== '%c') {
          return match;
        }

        const style = array[valueIndex];
        if (typeof style === 'string') {
          foundStyles[valueIndex] = true;
          styleApplied = true;
          return onStyleFound(style, item);
        }

        return match;
      });

      if (styleApplied && onStyleApplied) {
        item = onStyleApplied(item);
      }
    }

    result.push(item);
    return result;
  }, []);
}


/***/ }),

/***/ "./node_modules/electron-log/src/node/transforms/transform.js":
/*!********************************************************************!*\
  !*** ./node_modules/electron-log/src/node/transforms/transform.js ***!
  \********************************************************************/
/***/ ((module) => {

"use strict";


module.exports = { transform };

function transform({
  logger,
  message,
  transport,

  initialData = message?.data || [],
  transforms = transport?.transforms,
}) {
  return transforms.reduce((data, trans) => {
    if (typeof trans === 'function') {
      return trans({ data, logger, message, transport });
    }

    return data;
  }, initialData);
}


/***/ }),

/***/ "./node_modules/electron-log/src/node/transports/console.js":
/*!******************************************************************!*\
  !*** ./node_modules/electron-log/src/node/transports/console.js ***!
  \******************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


/* eslint-disable no-console */

const { concatFirstStringElements, format } = __webpack_require__(/*! ../transforms/format */ "./node_modules/electron-log/src/node/transforms/format.js");
const { maxDepth, toJSON } = __webpack_require__(/*! ../transforms/object */ "./node_modules/electron-log/src/node/transforms/object.js");
const { applyAnsiStyles, removeStyles } = __webpack_require__(/*! ../transforms/style */ "./node_modules/electron-log/src/node/transforms/style.js");
const { transform } = __webpack_require__(/*! ../transforms/transform */ "./node_modules/electron-log/src/node/transforms/transform.js");

const consoleMethods = {
  error: console.error,
  warn: console.warn,
  info: console.info,
  verbose: console.info,
  debug: console.debug,
  silly: console.debug,
  log: console.log,
};

module.exports = consoleTransportFactory;

const separator = process.platform === 'win32' ? '>' : '›';
const DEFAULT_FORMAT = `%c{h}:{i}:{s}.{ms}{scope}%c ${separator} {text}`;

Object.assign(consoleTransportFactory, {
  DEFAULT_FORMAT,
});

function consoleTransportFactory(logger) {
  return Object.assign(transport, {
    format: DEFAULT_FORMAT,
    level: 'silly',
    transforms: [
      addTemplateColors,
      format,
      formatStyles,
      concatFirstStringElements,
      maxDepth,
      toJSON,
    ],
    useStyles: process.env.FORCE_STYLES,

    writeFn({ message }) {
      const consoleLogFn = consoleMethods[message.level] || consoleMethods.info;
      consoleLogFn(...message.data);
    },
  });

  function transport(message) {
    const data = transform({ logger, message, transport });
    transport.writeFn({
      message: { ...message, data },
    });
  }
}

function addTemplateColors({ data, message, transport }) {
  if (transport.format !== DEFAULT_FORMAT) {
    return data;
  }

  return [`color:${levelToStyle(message.level)}`, 'color:unset', ...data];
}

function canUseStyles(useStyleValue, level) {
  if (typeof useStyleValue === 'boolean') {
    return useStyleValue;
  }

  const useStderr = level === 'error' || level === 'warn';
  const stream = useStderr ? process.stderr : process.stdout;
  return stream && stream.isTTY;
}

function formatStyles(args) {
  const { message, transport } = args;
  const useStyles = canUseStyles(transport.useStyles, message.level);
  const nextTransform = useStyles ? applyAnsiStyles : removeStyles;
  return nextTransform(args);
}

function levelToStyle(level) {
  const map = { error: 'red', warn: 'yellow', info: 'cyan', default: 'unset' };
  return map[level] || map.default;
}


/***/ }),

/***/ "./node_modules/electron-log/src/node/transports/file/File.js":
/*!********************************************************************!*\
  !*** ./node_modules/electron-log/src/node/transports/file/File.js ***!
  \********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const EventEmitter = __webpack_require__(/*! events */ "events");
const fs = __webpack_require__(/*! fs */ "fs");
const os = __webpack_require__(/*! os */ "os");

class File extends EventEmitter {
  asyncWriteQueue = [];
  bytesWritten = 0;
  hasActiveAsyncWriting = false;
  path = null;
  initialSize = undefined;
  writeOptions = null;
  writeAsync = false;

  constructor({
    path,
    writeOptions = { encoding: 'utf8', flag: 'a', mode: 0o666 },
    writeAsync = false,
  }) {
    super();

    this.path = path;
    this.writeOptions = writeOptions;
    this.writeAsync = writeAsync;
  }

  get size() {
    return this.getSize();
  }

  clear() {
    try {
      fs.writeFileSync(this.path, '', {
        mode: this.writeOptions.mode,
        flag: 'w',
      });
      this.reset();
      return true;
    } catch (e) {
      if (e.code === 'ENOENT') {
        return true;
      }

      this.emit('error', e, this);
      return false;
    }
  }

  crop(bytesAfter) {
    try {
      const content = readFileSyncFromEnd(this.path, bytesAfter || 4096);
      this.clear();
      this.writeLine(`[log cropped]${os.EOL}${content}`);
    } catch (e) {
      this.emit(
        'error',
        new Error(`Couldn't crop file ${this.path}. ${e.message}`),
        this,
      );
    }
  }

  getSize() {
    if (this.initialSize === undefined) {
      try {
        const stats = fs.statSync(this.path);
        this.initialSize = stats.size;
      } catch (e) {
        this.initialSize = 0;
      }
    }

    return this.initialSize + this.bytesWritten;
  }

  increaseBytesWrittenCounter(text) {
    this.bytesWritten += Buffer.byteLength(text, this.writeOptions.encoding);
  }

  isNull() {
    return false;
  }

  nextAsyncWrite() {
    const file = this;

    if (this.hasActiveAsyncWriting || this.asyncWriteQueue.length === 0) {
      return;
    }

    const text = this.asyncWriteQueue.join('');
    this.asyncWriteQueue = [];
    this.hasActiveAsyncWriting = true;

    fs.writeFile(this.path, text, this.writeOptions, (e) => {
      file.hasActiveAsyncWriting = false;

      if (e) {
        file.emit(
          'error',
          new Error(`Couldn't write to ${file.path}. ${e.message}`),
          this,
        );
      } else {
        file.increaseBytesWrittenCounter(text);
      }

      file.nextAsyncWrite();
    });
  }

  reset() {
    this.initialSize = undefined;
    this.bytesWritten = 0;
  }

  toString() {
    return this.path;
  }

  writeLine(text) {
    text += os.EOL;

    if (this.writeAsync) {
      this.asyncWriteQueue.push(text);
      this.nextAsyncWrite();
      return;
    }

    try {
      fs.writeFileSync(this.path, text, this.writeOptions);
      this.increaseBytesWrittenCounter(text);
    } catch (e) {
      this.emit(
        'error',
        new Error(`Couldn't write to ${this.path}. ${e.message}`),
        this,
      );
    }
  }
}

module.exports = File;

function readFileSyncFromEnd(filePath, bytesCount) {
  const buffer = Buffer.alloc(bytesCount);
  const stats = fs.statSync(filePath);

  const readLength = Math.min(stats.size, bytesCount);
  const offset = Math.max(0, stats.size - bytesCount);

  const fd = fs.openSync(filePath, 'r');
  const totalBytes = fs.readSync(fd, buffer, 0, readLength, offset);
  fs.closeSync(fd);

  return buffer.toString('utf8', 0, totalBytes);
}


/***/ }),

/***/ "./node_modules/electron-log/src/node/transports/file/FileRegistry.js":
/*!****************************************************************************!*\
  !*** ./node_modules/electron-log/src/node/transports/file/FileRegistry.js ***!
  \****************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const EventEmitter = __webpack_require__(/*! events */ "events");
const fs = __webpack_require__(/*! fs */ "fs");
const path = __webpack_require__(/*! path */ "path");
const File = __webpack_require__(/*! ./File */ "./node_modules/electron-log/src/node/transports/file/File.js");
const NullFile = __webpack_require__(/*! ./NullFile */ "./node_modules/electron-log/src/node/transports/file/NullFile.js");

class FileRegistry extends EventEmitter {
  store = {};

  constructor() {
    super();
    this.emitError = this.emitError.bind(this);
  }

  /**
   * Provide a File object corresponding to the filePath
   * @param {string} filePath
   * @param {WriteOptions} [writeOptions]
   * @param {boolean} [writeAsync]
   * @return {File}
   */
  provide({ filePath, writeOptions = {}, writeAsync = false }) {
    let file;
    try {
      filePath = path.resolve(filePath);

      if (this.store[filePath]) {
        return this.store[filePath];
      }

      file = this.createFile({ filePath, writeOptions, writeAsync });
    } catch (e) {
      file = new NullFile({ path: filePath });
      this.emitError(e, file);
    }

    file.on('error', this.emitError);
    this.store[filePath] = file;
    return file;
  }

  /**
   * @param {string} filePath
   * @param {WriteOptions} writeOptions
   * @param {boolean} async
   * @return {File}
   * @private
   */
  createFile({ filePath, writeOptions, writeAsync }) {
    this.testFileWriting({ filePath, writeOptions });
    return new File({ path: filePath, writeOptions, writeAsync });
  }

  /**
   * @param {Error} error
   * @param {File} file
   * @private
   */
  emitError(error, file) {
    this.emit('error', error, file);
  }

  /**
   * @param {string} filePath
   * @param {WriteOptions} writeOptions
   * @private
   */
  testFileWriting({ filePath, writeOptions }) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, '', { flag: 'a', mode: writeOptions.mode });
  }
}

module.exports = FileRegistry;


/***/ }),

/***/ "./node_modules/electron-log/src/node/transports/file/NullFile.js":
/*!************************************************************************!*\
  !*** ./node_modules/electron-log/src/node/transports/file/NullFile.js ***!
  \************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const File = __webpack_require__(/*! ./File */ "./node_modules/electron-log/src/node/transports/file/File.js");

class NullFile extends File {
  clear() {

  }

  crop() {

  }

  getSize() {
    return 0;
  }

  isNull() {
    return true;
  }

  writeLine() {

  }
}

module.exports = NullFile;


/***/ }),

/***/ "./node_modules/electron-log/src/node/transports/file/index.js":
/*!*********************************************************************!*\
  !*** ./node_modules/electron-log/src/node/transports/file/index.js ***!
  \*********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(/*! fs */ "fs");
const os = __webpack_require__(/*! os */ "os");
const path = __webpack_require__(/*! path */ "path");
const FileRegistry = __webpack_require__(/*! ./FileRegistry */ "./node_modules/electron-log/src/node/transports/file/FileRegistry.js");
const { transform } = __webpack_require__(/*! ../../transforms/transform */ "./node_modules/electron-log/src/node/transforms/transform.js");
const { removeStyles } = __webpack_require__(/*! ../../transforms/style */ "./node_modules/electron-log/src/node/transforms/style.js");
const {
  format,
  concatFirstStringElements,
} = __webpack_require__(/*! ../../transforms/format */ "./node_modules/electron-log/src/node/transforms/format.js");
const { toString } = __webpack_require__(/*! ../../transforms/object */ "./node_modules/electron-log/src/node/transforms/object.js");

module.exports = fileTransportFactory;

// Shared between multiple file transport instances
const globalRegistry = new FileRegistry();

function fileTransportFactory(
  logger,
  { registry = globalRegistry, externalApi } = {},
) {
  /** @type {PathVariables} */
  let pathVariables;

  if (registry.listenerCount('error') < 1) {
    registry.on('error', (e, file) => {
      logConsole(`Can't write to ${file}`, e);
    });
  }

  return Object.assign(transport, {
    fileName: getDefaultFileName(logger.variables.processType),
    format: '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}',
    getFile,
    inspectOptions: { depth: 5 },
    level: 'silly',
    maxSize: 1024 ** 2,
    readAllLogs,
    sync: true,
    transforms: [removeStyles, format, concatFirstStringElements, toString],
    writeOptions: { flag: 'a', mode: 0o666, encoding: 'utf8' },

    archiveLogFn(file) {
      const oldPath = file.toString();
      const inf = path.parse(oldPath);
      try {
        fs.renameSync(oldPath, path.join(inf.dir, `${inf.name}.old${inf.ext}`));
      } catch (e) {
        logConsole('Could not rotate log', e);
        const quarterOfMaxSize = Math.round(transport.maxSize / 4);
        file.crop(Math.min(quarterOfMaxSize, 256 * 1024));
      }
    },

    resolvePathFn(vars) {
      return path.join(vars.libraryDefaultDir, vars.fileName);
    },

    setAppName(name) {
      logger.dependencies.externalApi.setAppName(name);
    },
  });

  function transport(message) {
    const file = getFile(message);

    const needLogRotation = transport.maxSize > 0
      && file.size > transport.maxSize;

    if (needLogRotation) {
      transport.archiveLogFn(file);
      file.reset();
    }

    const content = transform({ logger, message, transport });
    file.writeLine(content);
  }

  function initializeOnFirstAccess() {
    if (pathVariables) {
      return;
    }

    // Make a shallow copy of pathVariables to keep getters intact
    pathVariables = Object.create(
      Object.prototype,
      {
        ...Object.getOwnPropertyDescriptors(
          externalApi.getPathVariables(),
        ),
        fileName: {
          get() {
            return transport.fileName;
          },
          enumerable: true,
        },
      },
    );

    if (typeof transport.archiveLog === 'function') {
      transport.archiveLogFn = transport.archiveLog;
      logConsole('archiveLog is deprecated. Use archiveLogFn instead');
    }

    if (typeof transport.resolvePath === 'function') {
      transport.resolvePathFn = transport.resolvePath;
      logConsole('resolvePath is deprecated. Use resolvePathFn instead');
    }
  }

  function logConsole(message, error = null, level = 'error') {
    const data = [`electron-log.transports.file: ${message}`];

    if (error) {
      data.push(error);
    }

    logger.transports.console({ data, date: new Date(), level });
  }

  function getFile(msg) {
    initializeOnFirstAccess();

    const filePath = transport.resolvePathFn(pathVariables, msg);
    return registry.provide({
      filePath,
      writeAsync: !transport.sync,
      writeOptions: transport.writeOptions,
    });
  }

  function readAllLogs({ fileFilter = (f) => f.endsWith('.log') } = {}) {
    initializeOnFirstAccess();
    const logsPath = path.dirname(transport.resolvePathFn(pathVariables));

    if (!fs.existsSync(logsPath)) {
      return [];
    }

    return fs.readdirSync(logsPath)
      .map((fileName) => path.join(logsPath, fileName))
      .filter(fileFilter)
      .map((logPath) => {
        try {
          return {
            path: logPath,
            lines: fs.readFileSync(logPath, 'utf8').split(os.EOL),
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }
}

function getDefaultFileName(processType = process.type) {
  switch (processType) {
    case 'renderer': return 'renderer.log';
    case 'worker': return 'worker.log';
    default: return 'main.log';
  }
}


/***/ }),

/***/ "./node_modules/electron-log/src/node/transports/ipc.js":
/*!**************************************************************!*\
  !*** ./node_modules/electron-log/src/node/transports/ipc.js ***!
  \**************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const { maxDepth, toJSON } = __webpack_require__(/*! ../transforms/object */ "./node_modules/electron-log/src/node/transforms/object.js");
const { transform } = __webpack_require__(/*! ../transforms/transform */ "./node_modules/electron-log/src/node/transforms/transform.js");

module.exports = ipcTransportFactory;

/**
 * @param logger
 * @param {ElectronExternalApi} externalApi
 * @returns {transport|null}
 */
function ipcTransportFactory(logger, { externalApi }) {
  Object.assign(transport, {
    depth: 3,
    eventId: '__ELECTRON_LOG_IPC__',
    level: logger.isDev ? 'silly' : false,
    transforms: [toJSON, maxDepth],
  });

  return externalApi?.isElectron() ? transport : undefined;

  function transport(message) {
    if (message?.variables?.processType === 'renderer') {
      return;
    }

    externalApi?.sendIpc(transport.eventId, {
      ...message,
      data: transform({ logger, message, transport }),
    });
  }
}


/***/ }),

/***/ "./node_modules/electron-log/src/node/transports/remote.js":
/*!*****************************************************************!*\
  !*** ./node_modules/electron-log/src/node/transports/remote.js ***!
  \*****************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const http = __webpack_require__(/*! http */ "http");
const https = __webpack_require__(/*! https */ "https");
const { transform } = __webpack_require__(/*! ../transforms/transform */ "./node_modules/electron-log/src/node/transforms/transform.js");
const { removeStyles } = __webpack_require__(/*! ../transforms/style */ "./node_modules/electron-log/src/node/transforms/style.js");
const { toJSON, maxDepth } = __webpack_require__(/*! ../transforms/object */ "./node_modules/electron-log/src/node/transforms/object.js");

module.exports = remoteTransportFactory;

function remoteTransportFactory(logger) {
  return Object.assign(transport, {
    client: { name: 'electron-application' },
    depth: 6,
    level: false,
    requestOptions: {},
    transforms: [removeStyles, toJSON, maxDepth],

    makeBodyFn({ message }) {
      return JSON.stringify({
        client: transport.client,
        data: message.data,
        date: message.date.getTime(),
        level: message.level,
        scope: message.scope,
        variables: message.variables,
      });
    },

    processErrorFn({ error }) {
      logger.processMessage(
        {
          data: [`electron-log: can't POST ${transport.url}`, error],
          level: 'warn',
        },
        { transports: ['console', 'file'] },
      );
    },

    sendRequestFn({ serverUrl, requestOptions, body }) {
      const httpTransport = serverUrl.startsWith('https:') ? https : http;

      const request = httpTransport.request(serverUrl, {
        method: 'POST',
        ...requestOptions,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': body.length,
          ...requestOptions.headers,
        },
      });

      request.write(body);
      request.end();

      return request;
    },
  });

  function transport(message) {
    if (!transport.url) {
      return;
    }

    const body = transport.makeBodyFn({
      logger,
      message: { ...message, data: transform({ logger, message, transport }) },
      transport,
    });

    const request = transport.sendRequestFn({
      serverUrl: transport.url,
      requestOptions: transport.requestOptions,
      body: Buffer.from(body, 'utf8'),
    });

    request.on('error', (error) => transport.processErrorFn({
      error,
      logger,
      message,
      request,
      transport,
    }));
  }
}


/***/ }),

/***/ "./node_modules/electron-log/src/renderer/electron-log-preload.js":
/*!************************************************************************!*\
  !*** ./node_modules/electron-log/src/renderer/electron-log-preload.js ***!
  \************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let electron = {};

try {
  // eslint-disable-next-line global-require,import/no-extraneous-dependencies
  electron = __webpack_require__(/*! electron */ "electron");
} catch (e) {
  // require isn't available, not from a preload script
}

if (electron.ipcRenderer) {
  initialize(electron);
}

if (true) {
  module.exports = initialize;
}

/**
 * @param {Electron.ContextBridge} contextBridge
 * @param {Electron.IpcRenderer} ipcRenderer
 */
function initialize({ contextBridge, ipcRenderer }) {
  if (!ipcRenderer) {
    return;
  }

  ipcRenderer.on('__ELECTRON_LOG_IPC__', (_, message) => {
    window.postMessage({ cmd: 'message', ...message });
  });

  ipcRenderer
    .invoke('__ELECTRON_LOG__', { cmd: 'getOptions' })
    // eslint-disable-next-line no-console
    .catch((e) => console.error(new Error(
      'electron-log isn\'t initialized in the main process. '
      + `Please call log.initialize() before. ${e.message}`,
    )));

  const electronLog = {
    sendToMain(message) {
      try {
        ipcRenderer.send('__ELECTRON_LOG__', message);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('electronLog.sendToMain ', e, 'data:', message);

        ipcRenderer.send('__ELECTRON_LOG__', {
          cmd: 'errorHandler',
          error: { message: e?.message, stack: e?.stack },
          errorName: 'sendToMain',
        });
      }
    },

    log(...data) {
      electronLog.sendToMain({ data, level: 'info' });
    },
  };

  for (const level of ['error', 'warn', 'info', 'verbose', 'debug', 'silly']) {
    electronLog[level] = (...data) => electronLog.sendToMain({
      data,
      level,
    });
  }

  if (contextBridge && process.contextIsolated) {
    try {
      contextBridge.exposeInMainWorld('__electronLog', electronLog);
    } catch {
      // Sometimes this files can be included twice
    }
  }

  if (typeof window === 'object') {
    window.__electronLog = electronLog;
  } else {
    // noinspection JSConstantReassignment
    __electronLog = electronLog;
  }
}


/***/ }),

/***/ "./node_modules/electron-log/src/renderer/index.js":
/*!*********************************************************!*\
  !*** ./node_modules/electron-log/src/renderer/index.js ***!
  \*********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const Logger = __webpack_require__(/*! ../core/Logger */ "./node_modules/electron-log/src/core/Logger.js");
const RendererErrorHandler = __webpack_require__(/*! ./lib/RendererErrorHandler */ "./node_modules/electron-log/src/renderer/lib/RendererErrorHandler.js");
const transportConsole = __webpack_require__(/*! ./lib/transports/console */ "./node_modules/electron-log/src/renderer/lib/transports/console.js");
const transportIpc = __webpack_require__(/*! ./lib/transports/ipc */ "./node_modules/electron-log/src/renderer/lib/transports/ipc.js");

module.exports = createLogger();
module.exports.Logger = Logger;
module.exports["default"] = module.exports;

function createLogger() {
  const logger = new Logger({
    allowUnknownLevel: true,
    errorHandler: new RendererErrorHandler(),
    initializeFn: () => {},
    logId: 'default',
    transportFactories: {
      console: transportConsole,
      ipc: transportIpc,
    },
    variables: {
      processType: 'renderer',
    },
  });

  logger.errorHandler.setOptions({
    logFn({ error, errorName, showDialog }) {
      logger.transports.console({
        data: [errorName, error].filter(Boolean),
        level: 'error',
      });
      logger.transports.ipc({
        cmd: 'errorHandler',
        error: {
          cause: error?.cause,
          code: error?.code,
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
        },
        errorName,
        logId: logger.logId,
        showDialog,
      });
    },
  });

  if (typeof window === 'object') {
    window.addEventListener('message', (event) => {
      const { cmd, logId, ...message } = event.data || {};
      const instance = Logger.getInstance({ logId });

      if (cmd === 'message') {
        instance.processMessage(message, { transports: ['console'] });
      }
    });
  }

  // To support custom levels
  return new Proxy(logger, {
    get(target, prop) {
      if (typeof target[prop] !== 'undefined') {
        return target[prop];
      }

      return (...data) => logger.logData(data, { level: prop });
    },
  });
}


/***/ }),

/***/ "./node_modules/electron-log/src/renderer/lib/RendererErrorHandler.js":
/*!****************************************************************************!*\
  !*** ./node_modules/electron-log/src/renderer/lib/RendererErrorHandler.js ***!
  \****************************************************************************/
/***/ ((module) => {

"use strict";


// eslint-disable-next-line no-console
const consoleError = console.error;

class RendererErrorHandler {
  logFn = null;
  onError = null;
  showDialog = false;
  preventDefault = true;

  constructor({ logFn = null } = {}) {
    this.handleError = this.handleError.bind(this);
    this.handleRejection = this.handleRejection.bind(this);
    this.startCatching = this.startCatching.bind(this);
    this.logFn = logFn;
  }

  handle(error, {
    logFn = this.logFn,
    errorName = '',
    onError = this.onError,
    showDialog = this.showDialog,
  } = {}) {
    try {
      if (onError?.({ error, errorName, processType: 'renderer' }) !== false) {
        logFn({ error, errorName, showDialog });
      }
    } catch {
      consoleError(error);
    }
  }

  setOptions({ logFn, onError, preventDefault, showDialog }) {
    if (typeof logFn === 'function') {
      this.logFn = logFn;
    }

    if (typeof onError === 'function') {
      this.onError = onError;
    }

    if (typeof preventDefault === 'boolean') {
      this.preventDefault = preventDefault;
    }

    if (typeof showDialog === 'boolean') {
      this.showDialog = showDialog;
    }
  }

  startCatching({ onError, showDialog } = {}) {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.setOptions({ onError, showDialog });

    window.addEventListener('error', (event) => {
      this.preventDefault && event.preventDefault?.();
      this.handleError(event.error || event);
    });
    window.addEventListener('unhandledrejection', (event) => {
      this.preventDefault && event.preventDefault?.();
      this.handleRejection(event.reason || event);
    });
  }

  handleError(error) {
    this.handle(error, { errorName: 'Unhandled' });
  }

  handleRejection(reason) {
    const error = reason instanceof Error
      ? reason
      : new Error(JSON.stringify(reason));
    this.handle(error, { errorName: 'Unhandled rejection' });
  }
}

module.exports = RendererErrorHandler;


/***/ }),

/***/ "./node_modules/electron-log/src/renderer/lib/transports/console.js":
/*!**************************************************************************!*\
  !*** ./node_modules/electron-log/src/renderer/lib/transports/console.js ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";


/* eslint-disable no-console */

module.exports = consoleTransportRendererFactory;

const consoleMethods = {
  error: console.error,
  warn: console.warn,
  info: console.info,
  verbose: console.info,
  debug: console.debug,
  silly: console.debug,
  log: console.log,
};

function consoleTransportRendererFactory(logger) {
  return Object.assign(transport, {
    format: '{h}:{i}:{s}.{ms}{scope} › {text}',

    formatDataFn({
      data = [],
      date = new Date(),
      format = transport.format,
      logId = logger.logId,
      scope = logger.scopeName,
      ...message
    }) {
      if (typeof format === 'function') {
        return format({ ...message, data, date, logId, scope });
      }

      if (typeof format !== 'string') {
        return data;
      }

      data.unshift(format);

      // Concatenate first two data items to support printf-like templates
      if (typeof data[1] === 'string' && data[1].match(/%[1cdfiOos]/)) {
        data = [`${data[0]} ${data[1]}`, ...data.slice(2)];
      }

      data[0] = data[0]
        .replace(/\{(\w+)}/g, (substring, name) => {
          switch (name) {
            case 'level': return message.level;
            case 'logId': return logId;
            case 'scope': return scope ? ` (${scope})` : '';
            case 'text': return '';

            case 'y': return date.getFullYear().toString(10);
            case 'm': return (date.getMonth() + 1).toString(10)
              .padStart(2, '0');
            case 'd': return date.getDate().toString(10).padStart(2, '0');
            case 'h': return date.getHours().toString(10).padStart(2, '0');
            case 'i': return date.getMinutes().toString(10).padStart(2, '0');
            case 's': return date.getSeconds().toString(10).padStart(2, '0');
            case 'ms': return date.getMilliseconds().toString(10)
              .padStart(3, '0');
            case 'iso': return date.toISOString();

            default: {
              return message.variables?.[name] || substring;
            }
          }
        })
        .trim();

      return data;
    },

    writeFn({ message: { level, data } }) {
      const consoleLogFn = consoleMethods[level] || consoleMethods.info;

      // make an empty call stack
      setTimeout(() => consoleLogFn(...data));
    },

  });

  function transport(message) {
    transport.writeFn({
      message: { ...message, data: transport.formatDataFn(message) },
    });
  }
}


/***/ }),

/***/ "./node_modules/electron-log/src/renderer/lib/transports/ipc.js":
/*!**********************************************************************!*\
  !*** ./node_modules/electron-log/src/renderer/lib/transports/ipc.js ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";


module.exports = ipcTransportRendererFactory;

const RESTRICTED_TYPES = new Set([Promise, WeakMap, WeakSet]);

function ipcTransportRendererFactory(logger) {
  return Object.assign(transport, {
    depth: 5,

    serializeFn(data, { depth = 5, seen = new WeakSet() } = {}) {
      if (seen.has(data)) {
        return '[Circular]';
      }

      if (depth < 1) {
        if (isPrimitive(data)) {
          return data;
        }

        if (Array.isArray(data)) {
          return '[Array]';
        }

        return `[${typeof data}]`;
      }

      if (['function', 'symbol'].includes(typeof data)) {
        return data.toString();
      }

      if (isPrimitive(data)) {
        return data;
      }

      // Object types

      if (RESTRICTED_TYPES.has(data.constructor)) {
        return `[${data.constructor.name}]`;
      }

      if (Array.isArray(data)) {
        return data.map((item) => transport.serializeFn(
          item,
          { depth: depth - 1, seen },
        ));
      }

      if (data instanceof Date) {
        return data.toISOString();
      }

      if (data instanceof Error) {
        return data.stack;
      }

      if (data instanceof Map) {
        return new Map(
          Array
            .from(data)
            .map(([key, value]) => [
              transport.serializeFn(key, { depth: depth - 1, seen }),
              transport.serializeFn(value, { depth: depth - 1, seen }),
            ]),
        );
      }

      if (data instanceof Set) {
        return new Set(
          Array.from(data).map(
            (val) => transport.serializeFn(val, { depth: depth - 1, seen }),
          ),
        );
      }

      seen.add(data);

      return Object.fromEntries(
        Object.entries(data).map(
          ([key, value]) => [
            key,
            transport.serializeFn(value, { depth: depth - 1, seen }),
          ],
        ),
      );
    },
  });

  function transport(message) {
    if (!window.__electronLog) {
      logger.processMessage(
        {
          data: ['electron-log: logger isn\'t initialized in the main process'],
          level: 'error',
        },
        { transports: ['console'] },
      );
      return;
    }

    try {
      __electronLog.sendToMain(transport.serializeFn(message, {
        depth: transport.depth,
      }));
    } catch (e) {
      logger.transports.console({
        data: ['electronLog.transports.ipc', e, 'data:', message.data],
        level: 'error',
      });
    }
  }
}

/**
 * Is type primitive, including null and undefined
 * @param {any} value
 * @returns {boolean}
 */
function isPrimitive(value) {
  return Object(value) !== value;
}


/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("electron");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ "./node_modules/electron-is-dev/index.js":
/*!***********************************************!*\
  !*** ./node_modules/electron-is-dev/index.js ***!
  \***********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! electron */ "electron");


if (typeof electron__WEBPACK_IMPORTED_MODULE_0__ === 'string') {
	throw new TypeError('Not running in an Electron environment!');
}

const {env} = process; // eslint-disable-line n/prefer-global/process
const isEnvSet = 'ELECTRON_IS_DEV' in env;
const getFromEnv = Number.parseInt(env.ELECTRON_IS_DEV, 10) === 1;

const isDev = isEnvSet ? getFromEnv : !electron__WEBPACK_IMPORTED_MODULE_0__.app.isPackaged;

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (isDev);


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = __webpack_module_cache__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// module cache are used so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	var __webpack_exports__ = __webpack_require__(__webpack_require__.s = "./electron/main.js");
/******/ 	
/******/ })()
;
//# sourceMappingURL=main.js.map