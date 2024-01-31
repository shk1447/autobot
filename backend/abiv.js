const nodeAbi = require("node-abi");

console.log("node:" + nodeAbi.getAbi("16.19.0", "node"));
console.log("electron:" + nodeAbi.getAbi("12.2.3", "electron"));
