// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require("electron");

const _ = require("lodash");
const Jimp = require("jimp");
const path = require("path");
const fs = require("fs-extra");
const ioHook = require("iohook");
const robot = require("@jitsi/robotjs");
const { compareSnapshotsPlugin } = require("./src/compare");
const workerpool = require("workerpool");
const { wait, pad } = require("./src/utils");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

const pool = workerpool.pool(process.cwd() + "/src/macro.worker.js");

let mainWindow;
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
  mainWindow.loadFile("./dist/index.html");

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  // mainWindow.setPosition();
  // mainWindow.setSize();
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
ioHook.useRawcode(false);

ioHook.on("mousemove", (event) => {
  hookArray.push(event);
});
ioHook.on("mouseclick", (event) => {
  // hookArray.push(event);
});
ioHook.on("mousedrag", (event) => {
  hookArray.push(event);
});
ioHook.on("mousedown", (event) => {
  hookArray.push(event);
});
ioHook.on("mousewheel", (event) => {
  hookArray.push(event);
});

ioHook.on("mouseup", (event) => {
  hookArray.push(event);
});
ioHook.on("keydown", (event) => {
  // NOTE: 나중에 작업하자...
});

ioHook.on("keyup", (event) => {
  // NOTE: 나중에 작업하자...
});

robot.setMouseDelay(0);

const dataPath = path.resolve(process.cwd(), "./data.json");
if (!fs.existsSync(dataPath)) {
  fs.writeJSONSync(dataPath, { list: {} });
}
const data = JSON.parse(fs.readFileSync(dataPath));

ipcMain.handle("capture", async (event, args) => {
  const [x, y] = mainWindow.getPosition();
  const [width, height] = mainWindow.getSize();

  const bitmap = robot.screen.capture(x, y + 32, width, height - 64);

  new Jimp(
    { data: bitmap.image, width: bitmap.width, height: bitmap.height },
    async (err, image) => {
      await image.write(
        `./snapshots/${moment().format("YYYYMMDD_HHmmss")}.png`
      );
    }
  );
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
      const bitmap = robot.screen.capture(x, y + 32, width, height - 64);
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
          directory: process.cwd(),
          base: `./snapshots/${uuid}/base.png`,
          actual: `./snapshots/${uuid}/actual.png`,
          diff: `./snapshots/${uuid}/diff.png`,
        },
        result: {},
      };
      await hookImage.write(macro.path.base);
      data.list[uuid] = macro;
      break;
    }
    case "update": {
      data.list[args.uuid].name = args.name;
      break;
    }
    case "remove": {
      if (args.uuid != undefined) {
        fs.removeSync(
          path.resolve(process.cwd(), data.list[args.uuid].path.directory)
        );
        delete data.list[args.uuid];
      } else {
        fs.removeSync(path.resolve(process.cwd(), "./snapshots"));
        data.list = {};
      }
      break;
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(data));
  hookArray = [];
  hookImage = undefined;
});

ipcMain.handle("record", async (event, args) => {
  if (args) {
    hookArray = [];
    hookImage = undefined;
    ioHook.start();
    ioHook.start(true);
  } else {
    ioHook.stop();
    const [x, y] = mainWindow.getPosition();
    const [width, height] = mainWindow.getSize();
    const bitmap = robot.screen.capture(x, y + 32, width, height - 64);
    new Jimp(
      { data: bitmap.image, width: bitmap.width, height: bitmap.height },
      async (err, image) => {
        hookImage = image;
      }
    );
  }
});

ipcMain.handle("getResultImage", async (event, args) => {
  const readFile = fs.readFileSync(path.resolve(args.directory, args.diff));
  let encode = Buffer.from(readFile).toString("base64");

  return encode;
});

ipcMain.handle("play", async (event, args) => {
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  if (args == undefined) {
    await pool.exec("startMacro", [{ hooks: hookArray }]);
  } else {
    for (var uuid of args) {
      const macro = data.list[uuid];
      mainWindow.setPosition(macro.window.x, macro.window.y);
      mainWindow.setSize(macro.window.width, macro.window.height, false);
      await pool.exec("startMacro", [{ hooks: [...macro.hooks] }]);
      const bitmap = robot.screen.capture(
        macro.window.x,
        macro.window.y + 32,
        macro.window.width,
        macro.window.height - 64
      );
      await new Promise(
        (resolve) =>
          new Jimp(
            { data: bitmap.image, width: bitmap.width, height: bitmap.height },
            async (err, image) => {
              await image.write(macro.path.actual);
              const result = await compareSnapshotsPlugin({
                base: macro.path.base,
                actual: macro.path.actual,
                diff: macro.path.diff,
              });

              data.list[uuid].result["percentage"] = result.percentage;
              fs.writeFileSync(dataPath, JSON.stringify(data));
              resolve();
            }
          )
      );
      wait(0.5);
    }
  }

  mainWindow.setIgnoreMouseEvents(false);

  return true;
});
