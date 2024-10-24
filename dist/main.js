/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("electron");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

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
/************************************************************************/
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**************************!*\
  !*** ./electron/main.js ***!
  \**************************/
var __dirname = "electron";
var electron = __webpack_require__(/*! electron */ "electron");
var isDev = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'electron-is-dev'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
var fs = __webpack_require__(/*! fs */ "fs");
var log = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'electron-log'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
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
})();

/******/ })()
;
//# sourceMappingURL=main.js.map