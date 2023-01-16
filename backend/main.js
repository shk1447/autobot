// Modules to control application life and create native browser window
const { performance } = require("perf_hooks");
const { app, BrowserWindow, ipcMain } = require("electron");

const _ = require("lodash");
const Jimp = require("jimp");
const path = require("path");
const fs = require("fs-extra");
const ioHook = require("iohook");
const robot = require("@jitsi/robotjs");
const { compareSnapshotsPlugin } = require("./src/compare");
const workerpool = require("workerpool");
const { wait, createFolder } = require("./src/utils");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

const unhandled = require("electron-unhandled");

unhandled({
  logger: (err) => {
    if (err) {
      console.log(err);
      app.quit();
    }
  },
  showDialog: false,
  reportButton: (error) => {
    console.log("Report Button Initialized");
  },
});

const userDataPath = path.resolve(app.getPath("userData"));
createFolder(userDataPath, true);

const pool = workerpool.pool(
  path.resolve(app.getAppPath(), "./src/macro.worker.js")
);

let mainWindow;
let settingWindow;
let currentThrough = false;
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
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
      preload: path.join(__dirname, "preload.js"),
      blinkFeatures: "CSSStickyPosition",
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
  mainWindow.loadFile(path.resolve(app.getAppPath(), "../app/index.html"));

  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.setVisibleOnAllWorkspaces(true);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
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

ipcMain.handle("minimize", async (event, args) => {
  mainWindow.minimize();
  return true;
});

let bounding = undefined;
ipcMain.handle("maximize", async (event, args) => {
  if (!bounding) {
    const [x, y] = mainWindow.getPosition();
    const [width, height] = mainWindow.getSize();
    bounding = {
      x,
      y,
      width,
      height,
    };
    mainWindow.maximize();
  } else {
    mainWindow.setPosition(bounding.x, bounding.y);
    mainWindow.setSize(bounding.width, bounding.height);
    bounding = undefined;
  }
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

let hookArray = [];
let hookImage;
let startTime;

ipcMain.handle("record", async (event, args) => {
  if (args) {
    hookArray = [];
    hookImage = undefined;
    startTime = performance.now();
    ioHook.start();
    ioHook.start(true);
  } else {
    ioHook.stop();
    const [x, y] = mainWindow.getPosition();
    const [width, height] = mainWindow.getSize();
    const bitmap = robot.screen.capture(x + 2, y + 34, width - 4, height - 68);
    new Jimp(
      { data: bitmap.image, width: bitmap.width, height: bitmap.height },
      async (err, image) => {
        hookImage = image;
      }
    );
    hookArray.push({ type: "wait", wait_time: startTime - performance.now() });
    startTime = undefined;
  }
});

ioHook.useRawcode(false);
ioHook.on("mousemove", (event) => {
  hookArray.push({ ...event, wait_time: performance.now() - startTime });
  startTime = performance.now();
});
ioHook.on("mouseclick", (event) => {
  // hookArray.push(event);
});
ioHook.on("mousedrag", (event) => {
  hookArray.push({ ...event, wait_time: performance.now() - startTime });
  startTime = performance.now();
});
ioHook.on("mousedown", (event) => {
  hookArray.push({ ...event, wait_time: performance.now() - startTime });
  startTime = performance.now();
});
ioHook.on("mousewheel", (event) => {
  hookArray.push({ ...event, wait_time: performance.now() - startTime });
  startTime = performance.now();
});
ioHook.on("mouseup", (event) => {
  hookArray.push({ ...event, wait_time: performance.now() - startTime });
  startTime = performance.now();
});
ioHook.on("keydown", (event) => {
  // NOTE: 나중에 작업하자...
  hookArray.push({ ...event, wait_time: performance.now() - startTime });
  startTime = performance.now();
});
ioHook.on("keyup", (event) => {
  // NOTE: 나중에 작업하자...
  hookArray.push({ ...event, wait_time: performance.now() - startTime });
  startTime = performance.now();
});

robot.setMouseDelay(0);

const dataPath = path.resolve(userDataPath, "./data.json");
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify({ list: {} }));
}
const data = JSON.parse(fs.readFileSync(dataPath));

ipcMain.handle("capture", async (event, args) => {
  const [x, y] = mainWindow.getPosition();
  const [width, height] = mainWindow.getSize();

  const bitmap = robot.screen.capture(x + 2, y + 34, width - 4, height - 68);

  new Jimp(
    { data: bitmap.image, width: bitmap.width, height: bitmap.height },
    async (err, image) => {
      // hookImage = image;
      await image.write(
        path.resolve(
          userDataPath,
          `./snapshots/${moment().format("YYYYMMDD_HHmmss")}.png`
        )
      );
    }
  );
});

ipcMain.handle("settingWindow", async (event, args) => {
  settingWindow = new BrowserWindow({
    width: 500,
    height: 250,
    minWidth: 500,
    minHeight: 250,
    maxWidth: 500,
    maxHeight: 250,
    transparent: false,
    kiosk: false,
    fullscreen: false,
    fullscreenable: true,
    resizable: true,
    frame: false,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      blinkFeatures: "CSSStickyPosition",
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
    path.resolve(app.getAppPath(), "../app/setting.html"),
    { query: { test: 111 } }
  );

  settingWindow.webContents.openDevTools();

  settingWindow.once("ready-to-show", () => {
    settingWindow.show();
  });
  settingWindow.on("closed", function () {
    settingWindow = undefined;
  });
});

ipcMain.handle("load", async (event, args) => {
  const ret_list = {};
  for (var key of Object.keys(data.list)) {
    ret_list[key] = {
      uuid: data.list[key].uuid,
      name: data.list[key].name,
      cron: data.list[key].cron,
      path: data.list[key].path,
      result: data.list[key].result,
    };
  }
  return {
    list: ret_list,
    current: {
      save: hookArray.length > 0 ? false : true,
    },
  };
});

ipcMain.handle("save", async (event, args) => {
  const [x, y] = mainWindow.getPosition();
  const [width, height] = mainWindow.getSize();
  switch (args.type) {
    case "new": {
      const uuid = uuidv4();
      const macro = {
        uuid: uuid,
        name: "macro-" + Object.keys(data.list).length,
        hooks: hookArray,
        cron: ["?", "?", "*", "*", "*", "*"],
        window: {
          x: x,
          y: y,
          width: width,
          height: height,
        },
        path: {
          directory: userDataPath,
          base: `./snapshots/${uuid}/base.png`,
          actual: `./snapshots/${uuid}/actual.png`,
          diff: `./snapshots/${uuid}/diff.png`,
        },
        result: {},
      };
      await hookImage.write(
        path.resolve(macro.path.directory, macro.path.base)
      );
      data.list[uuid] = macro;
      break;
    }
    case "update": {
      data.list[args.uuid].name = args.name;
      break;
    }
    case "remove": {
      if (args.uuid != undefined) {
        fs.removeSync(path.resolve(userDataPath, `./snapshots/${args.uuid}`));
        delete data.list[args.uuid];
      } else {
        fs.removeSync(path.resolve(userDataPath, "./snapshots"));
        data.list = {};
      }
      break;
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(data));
  hookArray = [];
  hookImage = undefined;
});

ipcMain.handle("getResultImage", async (event, args) => {
  const readFile = fs.readFileSync(path.resolve(args.directory, args.diff));
  let encode = Buffer.from(readFile).toString("base64");

  return encode;
});

ipcMain.handle("play", async (event, args) => {
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  try {
    if (args == undefined) {
      await pool.exec("startMacro", [{ hooks: hookArray }], {
        on: function (payload) {
          console.log(payload);
        },
      });
    } else {
      for (var uuid of args) {
        const macro = data.list[uuid];
        mainWindow.setPosition(macro.window.x, macro.window.y);
        mainWindow.setSize(macro.window.width, macro.window.height, false);
        await pool.exec("startMacro", [{ hooks: [...macro.hooks] }], {
          on: function (payload) {
            console.log(payload);
          },
        });

        const bitmap = robot.screen.capture(
          macro.window.x + 2,
          macro.window.y + 34,
          macro.window.width - 4,
          macro.window.height - 68
        );

        await new Promise(
          (resolve) =>
            new Jimp(
              {
                data: bitmap.image,
                width: bitmap.width,
                height: bitmap.height,
              },
              async (err, image) => {
                await image.write(
                  path.resolve(macro.path.directory, macro.path.actual)
                );
                const result = await compareSnapshotsPlugin({
                  base: path.resolve(macro.path.directory, macro.path.base),
                  actual: path.resolve(macro.path.directory, macro.path.actual),
                  diff: path.resolve(macro.path.directory, macro.path.diff),
                });

                data.list[uuid].result["percentage"] = result.percentage;
                fs.writeFileSync(dataPath, JSON.stringify(data));
                resolve();
              }
            )
        );
        wait(1);
      }
    }
  } catch (error) {
    console.log(error);
  }

  mainWindow.setIgnoreMouseEvents(false);

  return true;
});
