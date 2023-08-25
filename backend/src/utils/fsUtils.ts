import fs from "fs";

// eslint-disable-next-line arrow-body-style
export const mkdirp = async (folderPath: any) => {
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

export const createFolder = async (folderPath: any, failSilently: any) => {
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
