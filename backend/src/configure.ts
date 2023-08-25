import path, { extname, resolve } from "path";
import fs from "fs-extra";
import { app } from "electron";
import _ from "lodash";
export type IConfig = {
  host: string;
  port: number;
  exec: string;
  type: "self" | "detach";
};

const config = JSON.parse(
  fs.readFileSync(path.resolve(app.getAppPath(), "./config.json"), "utf-8")
) as IConfig;

export default () => {
  if (!["self", "detach"].includes(config.type)) {
    config.type = "self";
  }
  return config;
};
