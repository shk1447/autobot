const fs = require("fs");

// eslint-disable-next-line arrow-body-style
const mkdirp = async (folderPath) => {
  return new Promise((resolve, reject) => {
    fs.mkdir(folderPath, { recursive: true }, (error) => {
      if (error) {
        console.log(error); // eslint-disable-line no-console
        reject(new Error(`Error in creating ${folderPath}`));
      }
      resolve(true);
    });
  });
};

const createFolder = async (folderPath, failSilently) => {
  if (!fs.existsSync(folderPath)) {
    try {
      await mkdirp(folderPath);
    } catch (error) {
      if (failSilently) {
        console.log(error); // eslint-disable-line no-console
        return false;
      }
      throw error;
    }
  }
  return true;
};

module.exports = {
  createFolder,
  mkdirp,
};
