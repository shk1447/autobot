const os = require("os");
const fs = require("fs-extra");
const path = require("path");
const { spawnSync } = require("child_process");
const platform = os.platform();
var _package = JSON.parse(
  fs.readFileSync(path.resolve("./package.json"), "utf8")
);

const target = "app";
_package.main = `./backend/src/${target}.js`;

fs.writeFileSync(
  path.resolve(`../${target}/package.json`),
  JSON.stringify(_package, null, 2)
);

spawnSync(platform == "linux" ? "npm" : "npm.cmd", ["install"], {
  cwd: `../${target}`,
});

spawnSync(platform == "linux" ? "npm" : "npm.cmd", ["run", "rebuild:sqlite"], {
  cwd: `../${target}`,
});

// spawnSync(platform == "linux" ? "npm" : "npm.cmd", ["run", "rebuild:canvas"], {
//   cwd: `../${target}`,
// });

fs.copySync(path.resolve(`./public`), path.resolve(`../${target}/public`));
fs.copySync(path.resolve(`./worker`), path.resolve(`../${target}/worker`));
fs.copyFileSync(
  path.resolve(`./favicon.ico`),
  path.resolve(`../${target}/favicon.ico`)
);
fs.copyFileSync(
  path.resolve(`./config.json`),
  path.resolve(`../${target}/config.json`)
);

fs.copySync(path.resolve(`./assets`), path.resolve(`../${target}/assets`));
