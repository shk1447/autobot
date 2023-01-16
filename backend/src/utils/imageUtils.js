const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { PNG } = require("pngjs");
const pixelmatch = require("pixelmatch");

// const { adjustCanvas, parseImage, errorSerialize } = require(".");

// eslint-disable-next-line arrow-body-style
const parseImage = async (image) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(image)) {
      reject(new Error(`Snapshot ${image} does not exist.`));
      return;
    }

    const fd = fs.createReadStream(image);
    /* eslint-disable func-names */
    fd.pipe(new PNG())
      .on("parsed", function () {
        const that = this;
        resolve(that);
      })
      .on("error", (error) => reject(error));
    /* eslint-enable func-names */
  });
};

const errorSerialize = (error) =>
  JSON.stringify(
    Object.getOwnPropertyNames(error).reduce(
      (obj, prop) =>
        Object.assign(obj, {
          [prop]: error[prop],
        }),
      {}
    )
  );

function adjustCanvas(image, width, height) {
  if (image.width === width && image.height === height) {
    // fast-path
    return image;
  }

  const imageAdjustedCanvas = new PNG({
    width,
    height,
    bitDepth: image.bitDepth,
    inputHasAlpha: true,
  });

  PNG.bitblt(image, imageAdjustedCanvas, 0, 0, image.width, image.height, 0, 0);

  return imageAdjustedCanvas;
}

const compareImages = async (args) => {
  const alwaysGenerateDiff = true;

  const errorThreshold = 50;

  const options = {
    actualImage: args.actual,
    expectedImage: args.base,
    diffImage: args.diff,
  };

  let mismatchedPixels = 0;
  let percentage = 0;
  try {
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
      { threshold: 0.1, alpha: 0.1, includeAA: true, diffMask: true }
    );
    percentage = (mismatchedPixels / diff.width / diff.height) ** 0.5;

    if (percentage > errorThreshold) {
      diff.pack().pipe(fs.createWriteStream(options.diffImage));
    } else if (alwaysGenerateDiff) {
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
  compareImages,
  parseImage,
  adjustCanvas,
  errorSerialize,
};
