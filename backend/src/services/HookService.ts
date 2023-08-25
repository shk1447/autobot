import { v4 as uuidv4 } from "uuid";
import fs from "fs-extra";
import path from "path";
import Jimp from "jimp";
import { performance } from "perf_hooks";
import { app, BrowserWindow, ipcMain } from "electron";
import ioHook from "iohook";
import robot from "@jitsi/robotjs";
import workerpool from "workerpool";
const pool = workerpool.pool(
  path.resolve(app.getAppPath(), "./worker/robot.worker.js")
);
import { wait, createFolder, compareImages } from "@app/src/utils";
const userDataPath = path.resolve(app.getPath("userData"));
const dataPath = path.resolve(userDataPath, "./data.json");
createFolder(userDataPath, true);
class HookService {
  mainWindow: BrowserWindow;
  hookArray: any[];
  hookImage: any;
  startTime: number;
  data;
  playing;
  constructor() {
    this.playing = false;
    this.hookArray = [];

    if (!fs.existsSync(dataPath)) {
      fs.writeFileSync(dataPath, JSON.stringify({ list: {} }));
    }
    this.data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    ioHook.useRawcode(false);
    ioHook.on("mousemove", (event) => {
      this.hookArray.push({
        ...event,
        wait_time: performance.now() - this.startTime,
      });
      this.startTime = performance.now();
    });
    ioHook.on("mouseclick", (event) => {
      // hookArray.push(event);
    });
    ioHook.on("mousedrag", (event) => {
      this.hookArray.push({
        ...event,
        wait_time: performance.now() - this.startTime,
      });
      this.startTime = performance.now();
    });
    ioHook.on("mousedown", (event) => {
      this.hookArray.push({
        ...event,
        wait_time: performance.now() - this.startTime,
      });
      this.startTime = performance.now();
    });
    ioHook.on("mousewheel", (event) => {
      this.hookArray.push({
        ...event,
        wait_time: performance.now() - this.startTime,
      });
      this.startTime = performance.now();
    });
    ioHook.on("mouseup", (event) => {
      this.hookArray.push({
        ...event,
        wait_time: performance.now() - this.startTime,
      });
      this.startTime = performance.now();
    });
    ioHook.on("keydown", (event) => {
      // NOTE: 나중에 작업하자...
      this.hookArray.push({
        ...event,
        wait_time: performance.now() - this.startTime,
      });
      this.startTime = performance.now();
    });
    ioHook.on("keyup", (event) => {
      // NOTE: 나중에 작업하자...
      this.hookArray.push({
        ...event,
        wait_time: performance.now() - this.startTime,
      });
      this.startTime = performance.now();
    });

    robot.setMouseDelay(0);
  }

  setWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  load() {
    const ret_list: any = {};
    for (var key of Object.keys(this.data.list)) {
      ret_list[key] = {
        uuid: this.data.list[key].uuid,
        name: this.data.list[key].name,
        cron: this.data.list[key].cron,
        path: this.data.list[key].path,
        result: this.data.list[key].result,
      };
    }
    return {
      list: ret_list,
      current: {
        save: this.hookArray.length > 0 ? false : true,
      },
    };
  }

  async capture() {
    const bitmap = robot.screen.capture();

    return new Promise<string>((resolve) => {
      new Jimp(
        { data: bitmap.image, width: bitmap.width, height: bitmap.height },
        async (err: any, image: Jimp) => {
          // hookImage = image;
          const base64 = await image.getBase64Async("image/png");
          resolve(base64);
        }
      );
    });
  }

  async save(args: any) {
    const [x, y] = this.mainWindow.getPosition();
    const [width, height] = this.mainWindow.getSize();
    switch (args.type) {
      case "new": {
        const uuid = uuidv4();
        const macro = {
          uuid: uuid,
          name: "macro-" + Object.keys(this.data.list).length,
          hooks: this.hookArray,
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
        await this.hookImage.write(
          path.resolve(macro.path.directory, macro.path.base)
        );
        this.data.list[uuid] = macro;
        break;
      }
      case "update": {
        this.data.list[args.uuid].name = args.name;
        break;
      }
      case "remove": {
        if (args.uuid != undefined) {
          fs.removeSync(path.resolve(userDataPath, `./snapshots/${args.uuid}`));
          delete this.data.list[args.uuid];
        } else {
          fs.removeSync(path.resolve(userDataPath, "./snapshots"));
          this.data.list = {};
        }
        break;
      }
    }

    fs.writeFileSync(dataPath, JSON.stringify(this.data));
    this.hookArray = [];
    this.hookImage = undefined;
  }
  record(flag: boolean) {
    if (flag) {
      this.hookArray = [];
      this.hookImage = undefined;
      this.startTime = performance.now();
      ioHook.start();
      ioHook.start(true);
    } else {
      ioHook.stop();
      const [x, y] = this.mainWindow.getPosition();
      const [width, height] = this.mainWindow.getSize();
      const bitmap = robot.screen.capture(
        x + 2,
        y + 34,
        width - 4,
        height - 68
      );
      new Jimp(
        { data: bitmap.image, width: bitmap.width, height: bitmap.height },
        async (err: any, image: any) => {
          this.hookImage = image;
        }
      );
      this.hookArray.push({
        type: "wait",
        wait_time: this.startTime - performance.now(),
      });
      this.startTime = undefined;
    }
  }

  async play(uuids?: string[]) {
    this.playing = true;
    this.mainWindow.setIgnoreMouseEvents(true, { forward: true });

    try {
      if (uuids == undefined) {
        await pool.exec("start_robot", [{ hooks: this.hookArray }], {
          on: function (payload) {
            console.log(payload);
          },
        });
      } else {
        for (var uuid of uuids) {
          const macro = this.data.list[uuid];
          this.mainWindow.setPosition(macro.window.x, macro.window.y);
          this.mainWindow.setSize(
            macro.window.width,
            macro.window.height,
            false
          );
          await pool.exec("start_robot", [{ hooks: [...macro.hooks] }], {
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
                async (err: any, image: any) => {
                  await image.write(
                    path.resolve(macro.path.directory, macro.path.actual)
                  );
                  const result = await compareImages({
                    base: path.resolve(macro.path.directory, macro.path.base),
                    actual: path.resolve(
                      macro.path.directory,
                      macro.path.actual
                    ),
                    diff: path.resolve(macro.path.directory, macro.path.diff),
                  });

                  this.data.list[uuid].result["percentage"] = result.percentage;
                  fs.writeFileSync(dataPath, JSON.stringify(this.data));
                  resolve(true);
                }
              )
          );
          wait(1);
        }
      }
    } catch (error) {
      console.log(error);
    }

    this.mainWindow.setIgnoreMouseEvents(false);
    this.playing = false;

    return true;
  }
}

export default new HookService();
