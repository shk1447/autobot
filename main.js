// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require("electron");

const _ = require("lodash");
const Jimp = require("jimp");
const path = require("path");
const fs = require("fs-extra");
const ioHook = require("iohook");
const robot = require("@jitsi/robotjs");
const { compareSnapshotsPlugin } = require("./src/compare");

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

ipcMain.handle("capture", async (event, args) => {
  const [x, y] = mainWindow.getPosition();
  const [width, height] = mainWindow.getSize();

  const bitmap = robot.screen.capture(x, y + 32, width, height - 64);
  new Jimp(
    { data: bitmap.image, width: bitmap.width, height: bitmap.height },
    async (err, image) => {
      await image.write("./actual.png");
      const result = await compareSnapshotsPlugin();
      console.log(result);
    }
  );
});

let hookArray = [];
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
  console.log(event);
});

ioHook.on("mouseup", (event) => {
  hookArray.push(event);
});
ioHook.on("keydown", (event) => {
  console.log(event);
});

ioHook.on("keyup", (event) => {
  hookArray.push(event);
});

robot.setMouseDelay(0);

const wait = (sec) => {
  const start = Date.now();
  let now = start;

  while (now - start < sec * 1000) {
    now = Date.now();
  }
};

const dataPath = path.resolve(process.cwd(), "./data.json");
if (!fs.existsSync(dataPath)) {
  fs.writeJSONSync(dataPath, { list: [] });
}
const data = JSON.parse(fs.readFileSync(dataPath));
console.log(data);

ipcMain.handle("load", async (event, args) => {
  console.log("load!!!");
  return data;
});

ipcMain.handle("save", async (event, args) => {
  console.log("save!!!");
  const [x, y] = mainWindow.getPosition();
  const [width, height] = mainWindow.getSize();
  switch (args.type) {
    case "new": {
      data.list.push({
        id: data.list.length,
        name: "macro-" + data.list.length,
        hooks: hookArray,
        cron: ["?", "?", "*", "*", "*", "*"],
        window: {
          x: x,
          y: y,
          width: width,
          height: height,
        },
      });
      break;
    }
    case "update": {
      data.list[args.idx].name = args.name;
      break;
    }
    case "remove": {
      if (args.idx != undefined) data.list.splice(args.idx, 1);
      else data.list = [];
      break;
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(data));
  hookArray = [];
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

ipcMain.handle("play", async (event, args) => {
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  const executeHooks = async (hooks) => {
    const result = await new Promise((resolve) => {
      const clicks = hooks.filter((d) => d.type == "mousedown");
      hooks.splice(hooks.indexOf(clicks[clicks.length - 1]), 3);
      for (var hook of hooks) {
        switch (hook.type) {
          case "mousemove": {
            wait(0.0005);
            robot.moveMouse(hook.x, hook.y);
            break;
          }
          case "mousewheel": {
            wait(0.1);
            robot.scrollMouse(0, -hook.rotation * hook.amount * 40);
            break;
          }
          case "mouseclick": {
            // wait(0.4);
            // const clickType =
            //   hook.button == 1 ? "left" : hook.button == 2 ? "right" : "middle";
            // robot.mouseClick(clickType);
            break;
          }
          case "mousedown": {
            wait(0.5);
            const clickType =
              hook.button == 1 ? "left" : hook.button == 2 ? "right" : "middle";
            robot.mouseToggle("down", clickType);

            break;
          }
          case "mouseup": {
            wait(0.5);
            const clickType =
              hook.button == 1 ? "left" : hook.button == 2 ? "right" : "middle";
            robot.mouseToggle("up", clickType);
            break;
          }
          case "mousedrag": {
            wait(0.0005);
            robot.dragMouse(hook.x, hook.y);
            break;
          }
          case "keyup": {
            wait(0.0005);
            if (hook.shiftKey || hook.altKey || hook.ctrlKey || hook.metaKey) {
              console.log("short cut!!! gogo");
            } else {
              const text = String.fromCharCode(hook.rawcode);
              robot.typeString(text.toLowerCase());
            }
            break;
          }
          case "keydown": {
            break;
          }
        }
      }

      resolve(true);
    });

    return result;
  };

  if (args == undefined) {
    executeHooks(hookArray);
  } else if (args >= 0) {
    const macro = data.list[args];
    mainWindow.setPosition(macro.window.x, macro.window.y);
    mainWindow.setSize(macro.window.width, macro.window.height, false);
    await new Promise((resolve) =>
      setTimeout(async () => {
        executeHooks([...macro.hooks]);
        resolve();
      }, 500)
    );
  } else {
    for (var macro of data.list) {
      mainWindow.setPosition(macro.window.x, macro.window.y);
      mainWindow.setSize(macro.window.width, macro.window.height, false);
      await new Promise((resolve) =>
        setTimeout(async () => {
          await executeHooks([...macro.hooks]);
          resolve();
        }, 500)
      );
      wait(1);
    }
  }

  mainWindow.setIgnoreMouseEvents(false);

  return true;
});
