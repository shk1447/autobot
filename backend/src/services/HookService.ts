import { v4 as uuidv4 } from "uuid";
import fs from "fs-extra";
import path from "path";
import Jimp from "jimp";
import { performance } from "perf_hooks";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import ioHook from "iohook";
import robot from "@jitsi/robotjs";
import workerpool from "workerpool";

import { loadImage, createCanvas, GlobalFonts } from "@napi-rs/canvas";

const font = path.resolve(app.getAppPath(), "../app/assets/MinSans-Black.otf");
GlobalFonts.registerFromPath(font, "MinSans");

const pool = workerpool.pool(
  path.resolve(app.getAppPath(), "./worker/robot.worker.js")
);
import { wait, createFolder, compareImages } from "@app/src/utils";
import _ from "lodash";
const userDataPath = path.resolve(app.getPath("userData"));
const dataPath = path.resolve(userDataPath, "./data.json");
const scenePath = path.resolve(userDataPath, "./scene");
import { windowManager, Window } from "node-window-manager";

createFolder(userDataPath, true);
class HookService {
  selectedWindow: Window;
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
        name: "Undefined Click Name",
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

  async screenCaptureToFile2(robotScreenPic: any, _path: any, clicks?: any) {
    return new Promise(async (resolve, reject) => {
      try {
        const image = new Jimp(robotScreenPic.width, robotScreenPic.height);
        let pos = 0;
        image.scan(
          0,
          0,
          image.bitmap.width,
          image.bitmap.height,
          (x, y, idx) => {
            image.bitmap.data[idx + 2] = robotScreenPic.image.readUInt8(pos++);
            image.bitmap.data[idx + 1] = robotScreenPic.image.readUInt8(pos++);
            image.bitmap.data[idx + 0] = robotScreenPic.image.readUInt8(pos++);
            image.bitmap.data[idx + 3] = robotScreenPic.image.readUInt8(pos++);
          }
        );

        if (clicks) {
          const clickPath = path.resolve(
            app.getAppPath(),
            "../app/assets/click.png"
          );
          const img = await Jimp.read(clickPath);
          for (let i = 0; i < clicks.length; i++) {
            const event = clicks[i];

            image.composite(
              img,
              event.x - this.data.env.targetWindow.bounds.x - 6,
              event.y - this.data.env.targetWindow.bounds.y - 6
            );
          }
        }

        image.write(_path, resolve);
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
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

  async _focusProcess(exe_path: string, options?: any) {
    const wins = windowManager.getWindows();
    const win = wins.find((d) => d.path == exe_path);
    if (win) {
      win.restore();
      win.bringToTop();
      let bounds = win.getBounds();
      if (options) {
        win.setBounds({
          x: bounds.x,
          y: bounds.y,
          width: options.env.targetWindow.bounds.width,
          height: options.env.targetWindow.bounds.height,
        });
      }

      if (
        win.isWindow() &&
        bounds.x &&
        bounds.y &&
        bounds.width &&
        bounds.height
      ) {
        // this.mainWindow.setPosition(bounds.x, bounds.y);
        this.mainWindow.setBounds({
          x: win.getBounds().x - 2,
          y: win.getBounds().y - 34,
          width: win.getBounds().width + 4,
          height: win.getBounds().height + 68,
        });

        this.selectedWindow = win;

        try {
          const screen_size = robot.getScreenSize();
          const curr_env = {
            screen_size: screen_size,
            targetWindow: {
              path: win.path,
              bounds: win.getBounds(),
            },
          };
          if (!options) {
            this.data["env"] = curr_env;
          } else {
            const screenRatio = {
              wRatio:
                curr_env.screen_size.width / options.env.screen_size.width,
              hRatio:
                curr_env.screen_size.height / options.env.screen_size.height,
            };
            const windowRatio = {
              xDiff:
                curr_env.targetWindow.bounds.x -
                options.env.targetWindow.bounds.x,
              yDiff:
                curr_env.targetWindow.bounds.y -
                options.env.targetWindow.bounds.y,
              wRatio:
                curr_env.targetWindow.bounds.width /
                options.env.targetWindow.bounds.width,
              hRatio:
                curr_env.targetWindow.bounds.height /
                options.env.targetWindow.bounds.height,
            };
            options.env["ratio"] = {
              window: windowRatio,
              screen: screenRatio,
            };
          }
          fs.writeFileSync(dataPath, JSON.stringify(this.data));
        } catch (error) {
          console.log(error);
        }

        return path.basename(exe_path);
      }
    }
  }

  async focusProcess() {
    const wins = windowManager.getWindows();

    const { canceled, filePaths } = await dialog.showOpenDialog(
      this.mainWindow,
      {
        properties: ["openFile"],
        filters: [{ name: "Program", extensions: ["exe"] }],
      }
    );

    if (!canceled) {
      if (filePaths.length > 0) {
        return this._focusProcess(filePaths[0]);
      }
    }

    return false;
  }

  async loadScene() {
    const { canceled, filePaths } = await dialog.showOpenDialog(
      this.mainWindow,
      {
        properties: ["openFile"],
        filters: [{ name: "Scene Json", extensions: ["json"] }],
        defaultPath: scenePath,
      }
    );

    if (!canceled) {
      if (filePaths.length > 0) {
        const loadedScene = fs.readFileSync(filePaths[0]);
        fs.writeFileSync(dataPath, loadedScene);
        const _data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
        if (_data.env && _data.env.targetWindow) {
          this._focusProcess(_data.env.targetWindow.path, _data);
          this.data = _data;
          console.log(this.data["env"]);
        }
        const sceneName = path
          .basename(filePaths[0])
          .replace(path.extname(filePaths[0]), "");
        return sceneName;
      }
    }

    return true;
  }

  async saveScene(name: string) {
    const currentScene = fs.readFileSync(dataPath);
    const filePath = path.resolve(scenePath, `./${name}.json`);
    if (!fs.existsSync(filePath))
      fs.createFileSync(path.resolve(scenePath, `./${name}.json`));
    fs.writeFileSync(path.resolve(scenePath, `./${name}.json`), currentScene);
  }

  async save(args: any) {
    const [x, y] = this.mainWindow.getPosition();
    const [width, height] = this.mainWindow.getSize();
    switch (args.type) {
      case "new": {
        // const monitors = windowManager.getMonitors();
        // console.log(monitors);
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
        // await this.screenCaptureToFile2(
        //   this.hookImage,
        //   path.resolve(macro.path.directory, macro.path.base)
        // );
        this.data.list[uuid] = macro;
        break;
      }
      case "update": {
        this.data.list[args.uuid].name = args.name;
        break;
      }
      case "update_click": {
        const aa = this.data.list[args.uuid].hooks.filter(
          (d: any) => d.type == "mouseup"
        );
        aa[args.idx]["name"] = args.name;
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
      case "up": {
        const selectedIdx = Object.keys(this.data.list).indexOf(args.uuid);
        const selectedData = { ...this.data.list[args.uuid] };

        var reorder: any = {};
        let i = 0;
        if (selectedIdx - 1 < 0) break;
        _.each(this.data.list, (v, k) => {
          if (selectedIdx - 1 == i) {
            reorder[args.uuid] = selectedData;
          }
          if (k != args.uuid) {
            reorder[k] = v;
          }
          i++;
        });
        delete this.data.list[args.uuid];
        console.log(Object.keys(reorder), selectedIdx);
        this.data.list = reorder;
        break;
      }
      case "down": {
        const _keys = Object.keys(this.data.list);
        const selectedIdx = _keys.indexOf(args.uuid);
        const selectedData = { ...this.data.list[args.uuid] };

        var reorder: any = {};
        let i = 0;
        if (selectedIdx + 1 >= _keys.length) break;
        _.each(this.data.list, (v, k) => {
          if (k != args.uuid) {
            reorder[k] = v;
          }
          if (selectedIdx + 1 == i) {
            reorder[args.uuid] = selectedData;
          }

          console.log(Object.keys(reorder), selectedIdx);

          i++;
        });
        delete this.data.list[args.uuid];

        this.data.list = reorder;
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

      this.hookArray.push({
        type: "wait",
        wait_time: this.startTime - performance.now(),
      });
      this.startTime = undefined;
    }
  }

  async getClickHooks(uuid: string) {
    const macro = this.data.list[uuid];
    const clicks = macro.hooks.filter((d: any) => d.type == "mouseup");
    clicks.pop();
    return clicks;
  }

  async getResultImage(sceneName: string, item: any) {
    const macroScenePath = path.resolve(scenePath, `./${sceneName}`);
    const diffImgPath = path.resolve(macroScenePath, item.path.diff);
    const readFile = fs.readFileSync(diffImgPath);
    let encode = Buffer.from(readFile).toString("base64");
    return encode;
  }

  async play(uuids?: string[], sceneName?: string, isTest?: boolean) {
    this.playing = true;
    this.mainWindow.setIgnoreMouseEvents(true, { forward: true });

    try {
      if (uuids == undefined) {
        await pool.exec(
          "start_robot",
          [{ hooks: this.hookArray, ratio: this.data.env.ratio }],
          {
            on: function (payload) {
              console.log(payload);
            },
          }
        );
      } else {
        if (sceneName) {
          const resultPath = path.resolve(scenePath, `./${sceneName}`);
          if (!fs.existsSync(resultPath)) fs.mkdirSync(resultPath);
        }
        for (let i = 0; i < uuids.length; i++) {
          const uuid = uuids[i];
          const macro = this.data.list[uuid];
          const bounds = this.selectedWindow.getBounds();
          this.mainWindow.setPosition(bounds.x - 2, bounds.y - 34);
          this.mainWindow.setSize(bounds.width + 4, bounds.height + 68, false);
          await pool.exec(
            "start_robot",
            [
              {
                hooks: [...macro.hooks],
                ratio: this.data.env.ratio,
              },
            ],
            {
              on: function (payload) {
                console.log(payload);
              },
            }
          );

          // if (!fs.existsSync(macro.path.directory))
          //   fs.mkdirSync(macro.path.directory);
          // const diffPath = path.resolve(macro.path.directory, macro.path.diff);
          // const basePath = path.resolve(macro.path.directory, macro.path.base);
          // const actualPath = path.resolve(
          //   macro.path.directory,
          //   macro.path.actual
          // );
          // if (!fs.existsSync(actualPath)) fs.createFileSync(actualPath);
          // if (!fs.existsSync(basePath)) fs.createFileSync(basePath);
          // if (!fs.existsSync(diffPath)) fs.createFileSync(diffPath);

          const bitmap = robot.screen.capture(
            this.selectedWindow.getBounds().x,
            this.selectedWindow.getBounds().y,
            this.selectedWindow.getBounds().width,
            this.selectedWindow.getBounds().height
          );
          if (sceneName) {
            const macroScenePath = path.resolve(scenePath, `./${sceneName}`);
            const sceneImgPath = path.resolve(
              macroScenePath,
              `./${String(i).padStart(2, "0")}_${macro.name}.png`
            );
            const baseImgPath = path.resolve(macroScenePath, macro.path.base);
            if (!isTest) {
              const clicks = macro.hooks.filter(
                (d: any) => d.type == "mouseup"
              );
              clicks.pop();
              await this.screenCaptureToFile2(bitmap, baseImgPath, []);
              /* 클릭에 대한 것들은 제외!!
              await this.screenCaptureToFile2(bitmap, sceneImgPath, clicks);
              const myimg = await loadImage(sceneImgPath);
              const canvas = createCanvas(myimg.width, myimg.height);
              const ctx = canvas.getContext("2d");
              ctx.drawImage(myimg, 0, 0);
              for (let i = 0; i < clicks.length; i++) {
                const click = clicks[i];

                ctx.font = "12px MinSans";
                ctx.fillStyle = "#3D3F44";

                ctx.fillText(
                  click.name,
                  click.x - this.data.env.targetWindow.bounds.x + 20,
                  click.y - this.data.env.targetWindow.bounds.y + 24
                );
              }

              const buf = canvas.toBuffer("image/png");

              fs.writeFileSync(sceneImgPath, buf);
              */
            } else {
              if (!fs.existsSync(baseImgPath)) {
                await this.screenCaptureToFile2(bitmap, baseImgPath, []);
                console.log("ttt");
              } else {
                console.log("ttt2");
                const actualImgPath = path.resolve(
                  macroScenePath,
                  macro.path.actual
                );
                const diffImgPath = path.resolve(
                  macroScenePath,
                  macro.path.diff
                );
                await this.screenCaptureToFile2(bitmap, actualImgPath, []);

                const result = await compareImages({
                  base: baseImgPath,
                  actual: actualImgPath,
                  diff: diffImgPath,
                });
                console.log(result);
                this.data.list[uuid].result["percentage"] = result.percentage;
                fs.writeFileSync(dataPath, JSON.stringify(this.data));
              }
            }
          }

          // 테스트를 위한 비교 코드는나중ㅇ.....
          // await new Promise(
          //   (resolve) =>
          //     new Jimp(
          //       {
          //         data: bitmap.image,
          //         width: bitmap.width,
          //         height: bitmap.height,
          //       },
          //       async (err: any, image: any) => {
          //         await image.write();
          //         if (sceneName) {
          //           await image.write();
          //         }
          //         const result = await compareImages({
          //           base: path.resolve(macro.path.directory, macro.path.base),
          //           actual: path.resolve(
          //             macro.path.directory,
          //             macro.path.actual
          //           ),
          //           diff: path.resolve(macro.path.directory, macro.path.diff),
          //         });
          //         console.log(result);
          //         this.data.list[uuid].result["percentage"] = result.percentage;
          //         fs.writeFileSync(dataPath, JSON.stringify(this.data));
          //         resolve(true);
          //       }
          //     )
          // );
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
