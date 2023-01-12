const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { PNG } = require("pngjs");
const pixelmatch = require("pixelmatch");

const {
  adjustCanvas,
  createFolder,
  parseImage,
  errorSerialize,
  getValueOrDefault,
} = require("./utils");

const compareSnapshotsPlugin = async (args) => {
  const snapshotBaseDirectory = path.resolve(process.cwd(), "snapshots");
  const snapshotDiffDirectory = path.join(process.cwd(), "snapshots", "diff");
  const alwaysGenerateDiff = true;
  const allowVisualRegressionToFail = true;
  const failSilently = true;
  const errorThreshold = 50;
  const specDirectory = "./spec";

  const fileName = "test2333333";

  const options = {
    actualImage: path.resolve(process.cwd(), `./actual.png`),
    expectedImage: path.resolve(process.cwd(), `./base.png`),
    diffImage: path.resolve(process.cwd(), `./diff.png`),
  };
  console.log(options);

  let mismatchedPixels = 0;
  let percentage = 0;
  try {
    await createFolder(snapshotDiffDirectory, failSilently);
    const imgExpected = await parseImage(options.expectedImage);
    const imgActual = await parseImage(options.actualImage);
    const diff = new PNG({
      width: Math.max(imgActual.width, imgExpected.width),
      height: Math.max(imgActual.height, imgExpected.height),
    });

    const imgActualFullCanvas = adjustCanvas(
      imgActual,
      diff.width,
      diff.height
    );
    const imgExpectedFullCanvas = adjustCanvas(
      imgExpected,
      diff.width,
      diff.height
    );

    mismatchedPixels = pixelmatch(
      imgActualFullCanvas.data,
      imgExpectedFullCanvas.data,
      diff.data,
      diff.width,
      diff.height,
      { threshold: 0.1, alpha: 0.1, includeAA: false, diffMask: true }
    );
    percentage = (mismatchedPixels / diff.width / diff.height) ** 0.5;

    if (percentage > errorThreshold) {
      const specFolder = path.join(snapshotDiffDirectory, specDirectory);
      await createFolder(specFolder, failSilently);
      diff.pack().pipe(fs.createWriteStream(options.diffImage));
      if (!allowVisualRegressionToFail)
        throw new Error(
          `The "${fileName}" image is different. Threshold limit exceeded! \nExpected: ${errorThreshold} \nActual: ${percentage}`
        );
    } else if (alwaysGenerateDiff) {
      const specFolder = path.join(snapshotDiffDirectory, specDirectory);
      await createFolder(specFolder, failSilently);
      diff.pack().pipe(fs.createWriteStream(options.diffImage));
    }
  } catch (error) {
    return { error: errorSerialize(error) };
  }
  return {
    mismatchedPixels,
    percentage,
  };
};

module.exports = {
  compareSnapshotsPlugin,
};
