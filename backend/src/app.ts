// Modules to control application life and create native browser window
import "module-alias/register";
import { app, BrowserWindow, ipcMain } from "electron";

import _ from "lodash";

const path = require("path");

const unhandled = require("electron-unhandled");

import ModuleManager from "@app/src/modules/index";
import WindowController from "@app/src/controllers/ipc/WindowController";
import HookController from "@app/src/controllers/ipc/HookController";
import { HttpController } from "@app/src/controllers/http";
import configure from "@app/src/configure";
import SettingWindowController from "@app/src/controllers/ipc/SettingWindowController";

const config = configure();

unhandled({
  logger: (err: any) => {
    if (err) {
      console.log(err);
      app.quit();
    }
  },
  showDialog: false,
  reportButton: (error: any) => {
    console.log("Report Button Initialized");
  },
});

function createMainWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 400,
    minHeight: 240,
    transparent: true,
    kiosk: false,
    fullscreen: false,
    fullscreenable: true,
    resizable: true,
    frame: false,
    show: true,
    webPreferences: {
      preload: path.resolve(app.getAppPath(), "../app/public/preload.js"),
      experimentalFeatures: true,
      nodeIntegration: true,
      nodeIntegrationInWorker: false,
      contextIsolation: false,
      webSecurity: false,
      sandbox: false,
      enableRemoteModule: true,
    },
    alwaysOnTop: true,
  });
  // and load the index.html of the app.
  mainWindow.loadFile(
    path.resolve(app.getAppPath(), "../app/macro/index.html")
  );

  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.setVisibleOnAllWorkspaces(true);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  return mainWindow;
}

function createSettingsWindow() {
  // Create the browser window.
  const settingWindow = new BrowserWindow({
    width: 460,
    height: 720,
    minWidth: 460,
    minHeight: 720,
    transparent: true,
    kiosk: false,
    fullscreen: false,
    fullscreenable: true,
    resizable: true,
    frame: false,
    show: true,
    webPreferences: {
      preload: path.resolve(app.getAppPath(), "../app/public/preload.js"),
      experimentalFeatures: true,
      nodeIntegration: true,
      nodeIntegrationInWorker: false,
      contextIsolation: false,
      webSecurity: false,
      sandbox: false,
      enableRemoteModule: true,
    },
    alwaysOnTop: true,
  });
  // and load the index.html of the app.
  settingWindow.loadFile(
    path.resolve(app.getAppPath(), "../app/setting/index.html")
  );

  settingWindow.setAlwaysOnTop(true, "screen-saver");
  settingWindow.setVisibleOnAllWorkspaces(true);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  return settingWindow;
}

const main = async () => {
  app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
  });
  await app.whenReady();

  await ModuleManager.initialize();

  const window = createMainWindow();
  const settingWindow = createSettingsWindow();
  settingWindow.hide();

  WindowController(window, settingWindow);
  HookController(window);
  // SettingWindowController(settingWindow);
  new HttpController();
};

main();
