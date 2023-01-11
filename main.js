// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require("electron");

const _ = require("lodash");
const Jimp = require("jimp");
const path = require("path");
const fs = require("fs-extra");
const ioHook = require("iohook");
const robot = require("@jitsi/robotjs");

let mainWindow;
let currentThrough = false;
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 500,
    height: 300,
    minWidth: 500,
    minHeight: 300,
    transparent: true,
    kiosk: false,
    fullscreen: false,
    fullscreenable: true,
    resizable: true,
    frame: false,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      blinkFeatures: "CSSStickyPosition",
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
  mainWindow.loadFile("./dist/index.html");

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle("exit", async (event, args) => {
  mainWindow.close();
  return true;
});

ipcMain.handle("click-through", async (event, args) => {
  if (args.through) {
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
    currentThrough = true;
  } else {
    mainWindow.setIgnoreMouseEvents(false, { forward: true });
    currentThrough = false;
  }
});

ipcMain.handle("capture", async (event, args) => {
  const [x, y] = mainWindow.getPosition();
  const [width, height] = mainWindow.getSize();

  const bitmap = robot.screen.capture(x, y + 32, width, height - 64);
  new Jimp(
    { data: bitmap.image, width: bitmap.width, height: bitmap.height },
    (err, image) => {
      image.write("./test.png");
    }
  );
});

let hookArray = [];
ioHook.useRawcode(false);

ioHook.on("mousemove", (event) => {
  hookArray.push(event);
});
ioHook.on("mouseclick", (event) => {
  hookArray.push(event);
});
ioHook.on("mousedrag", (event) => {
  hookArray.push(event);
});
ioHook.on("mousedown", (event) => {
  hookArray.push(event);
});
ioHook.on("mouseup", (event) => {
  hookArray.push(event);
});
ioHook.on("keydown", (event) => {
  // console.log(event);
});

ioHook.on("keyup", (event) => {
  hookArray.push(event);
});

ipcMain.handle("record", async (event, args) => {
  if (args) {
    hookArray = [];
    ioHook.start();
    ioHook.start(true);
  } else {
    ioHook.stop();
  }
});

robot.setMouseDelay(0);

const wait = (sec) => {
  const start = Date.now();
  let now = start;

  while (now - start < sec * 1000) {
    now = Date.now();
  }
};

ipcMain.handle("play", async (event, args) => {
  const clicks = hookArray.filter((d) => d.type == "mousedown");
  hookArray.splice(hookArray.indexOf(clicks[clicks.length - 1]), 3);
  for (var hook of hookArray) {
    switch (hook.type) {
      case "mousemove": {
        wait(0.0001);
        robot.moveMouse(hook.x, hook.y);
        break;
      }
      case "mouseclick": {
        wait(0.5);
        const clickType =
          hook.button == 1 ? "left" : hook.button == 2 ? "right" : "middle";
        robot.mouseClick(clickType);
        wait(0.5);
        break;
      }
      case "mousedown": {
        const clickType =
          hook.button == 1 ? "left" : hook.button == 2 ? "right" : "middle";
        robot.mouseToggle("down", clickType);
        wait(0.5);
        break;
      }
      case "mouseup": {
        const clickType =
          hook.button == 1 ? "left" : hook.button == 2 ? "right" : "middle";
        robot.mouseToggle("up", clickType);
        wait(0.5);
        break;
      }
      case "mousedrag": {
        wait(0.0001);
        robot.dragMouse(hook.x, hook.y);
        break;
      }
      case "keyup": {
        if (hook.shiftKey || hook.altKey || hook.ctrlKey || hook.metaKey) {
          console.log("short cut!!! gogo");
        } else {
          const text = String.fromCharCode(hook.rawcode);
          robot.typeString(text.toLowerCase());
        }
        wait(0.0001);
        break;
      }
      case "keydown": {
        break;
      }
    }
  }
});
