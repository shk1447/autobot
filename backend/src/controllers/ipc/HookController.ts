import HookService from "@app/src/services/HookService";
import { app, BrowserWindow, ipcMain, ipcRenderer } from "electron";

import robot from "@jitsi/robotjs";
import Jimp from "jimp";
import moment from "moment";
import { spawn } from "child_process";
import path from "path";
import fs from "fs-extra";

export default (window: BrowserWindow) => {
  const userDataPath = path.resolve(app.getPath("userData"));
  HookService.setWindow(window);

  ipcMain.handle("record", async (event, args) => {
    return await HookService.record(args);
  });

  ipcMain.handle("load", async (event, args) => {
    return await HookService.load();
  });

  ipcMain.handle("save", async (event, args) => {
    return await HookService.save(args);
  });
  ipcMain.handle("focusProcess", async (event, args) => {
    return await HookService.focusProcess();
  });
  ipcMain.handle("loadScene", async (event, args) => {
    return await HookService.loadScene();
  });

  ipcMain.handle("saveScene", async (event, args) => {
    return await HookService.saveScene(args);
  });

  ipcMain.handle("play", async (event, args) => {
    return await HookService.play(args.list, args.sceneName, args.isTest);
  });

  ipcMain.handle("getResultImage", async (event, args) => {
    // const readFile = fs.readFileSync(path.resolve(args.directory, args.path.diff));
    // let encode = Buffer.from(readFile).toString("base64");
    const encode = await HookService.getResultImage(args.sceneName, args.item);

    return encode;
  });

  ipcMain.handle("openUserFolder", async (event, args) => {
    let p = spawn("explorer", [userDataPath]);
    p.on("error", (err) => {
      p.kill();
    });
    return true;
  });

  ipcMain.handle("getClickHooks", (event, uuid) => {
    return HookService.getClickHooks(uuid);
  });

  ipcMain.handle("capture", async (event, args) => {
    const [x, y] = window.getPosition();
    const [width, height] = window.getSize();

    const bitmap = robot.screen.capture(x + 2, y + 34, width - 4, height - 68);

    new Jimp(
      { data: bitmap.image, width: bitmap.width, height: bitmap.height },
      async (err: any, image: any) => {
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
};
