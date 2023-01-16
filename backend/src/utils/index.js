const wait = (sec) => {
  const start = Date.now();
  let now = start;

  while (now - start < sec * 1000) {
    now = Date.now();
  }
};

const pad = (number, length) => {
  var str = "" + number;
  while (str.length < length) {
    str = "0" + str;
  }

  return str;
};

const imageUtils = require("./imageUtils");
const fsUtils = require("./fsUtils");
module.exports = {
  wait,
  pad,
  ...fsUtils,
  ...imageUtils,
};
