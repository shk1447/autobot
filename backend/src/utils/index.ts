export const wait = (sec: any) => {
  const start = Date.now();
  let now = start;

  while (now - start < sec * 1000) {
    now = Date.now();
  }
};

export const pad = (number: any, length: any) => {
  var str = "" + number;
  while (str.length < length) {
    str = "0" + str;
  }

  return str;
};

export * from "./imageUtils";
export * from "./fsUtils";
