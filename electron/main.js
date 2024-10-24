const electron = require('electron');
const isDev = require('electron-is-dev');
const log = require('electron-log');
const fs = require('fs');

log.info('Hello, log');
log.warn('Some problem appears');

// require("electron-reload")(__dirname);
// Module to control application life.
const { app } = electron;
// Module to create native browser window.
const { BrowserWindow } = electron;

const path = require('path');
// const url = require("url");

// const mssql = require("mssql");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  log.info('creating window');

  // and load the index.html of the app.
  if (isDev) {
    mainWindow.loadURL('http://localhost:4000');

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  } else {
    log.info(__dirname, path.join(app.getAppPath(), 'dist/index.html'), app.getAppPath());
    fs.readdir(app.getAppPath(), (err, files) => {
      if (err) {
        return;
      }
      files.forEach((file) => {
        log.info(file);
      });
    });
    mainWindow.loadURL(`file://${path.join(app.getAppPath(), 'dist/index.html')}`);
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
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
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
