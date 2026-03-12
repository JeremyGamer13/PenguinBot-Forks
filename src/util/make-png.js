const { createCanvas, loadImage } = require('canvas');

const makePng = async (buffer) => {
    const image = await loadImage(buffer);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);

    const pngBuffer = canvas.toBuffer();
    return pngBuffer;
};

module.exports = makePng;