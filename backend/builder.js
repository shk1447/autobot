const fs = require("fs");
const { resolve } = require("path");
const webpack = require("webpack");
// const { program } = require("commander");
// program.option("--watch");
// program.parse();
// const { watch } = program.opts();

const { spawnSync } = require("child_process");
// const { Writable } = require("stream");

const CopyWebpackPlugin = require("copy-webpack-plugin");

var _package = JSON.parse(fs.readFileSync(resolve("./package.json"), "utf8"));

delete _package.type;
_package.main = "main.js";
_package.devDependencies = {};
_package.dependencies = {
  electron: "12.2.3",
  "@jitsi/robotjs": "^0.6.11",
  iohook: "^0.9.3",
  jimp: "^0.16.2",
};

var target = "app";

var config = {
  watch: false,
  entry: resolve("./main.js"),
  target: "node",
  output: {
    path: resolve(`../${target}`),
    filename: "./main.js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [],
  },
  externals: {
    electron: "commonjs electron",
    "@jitsi/robotjs": "commonjs @jitsi/robotjs",
    iohook: "commonjs iohook",
    jimp: "commonjs jimp",
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: resolve("./src"),
          to: resolve(`../${target}/src`),
        },
      ],
    }),
  ],
};

console.log("start");
const compiler = webpack(config, (err, stats) => {
  if (err) {
    console.log(err);
  }
  console.log(stats.compilation.errors);
  fs.writeFileSync(
    resolve(`../${target}/package.json`),
    JSON.stringify(_package, null, 2)
  );
});

compiler.hooks.afterDone.tap("my-plugin", async () => {
  spawnSync("npm.cmd", ["install"], {
    cwd: `../${target}`,
  });
  console.log("end");
});
