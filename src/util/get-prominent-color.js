const Canvas = require("canvas");

// TODO: Make this  a PenguinBot util
/**
 * Gets the most prominent color in the center of an image, usually where a subject lies.
 * @param {Buffer<ArrayBufferLike>} imageBuffer Canvas.loadImage compatible
 * @returns {string} hex code
 */
const getProminentColor = async (imageBuffer) => {
    // get their "Prominent color" from the center of the image
    const canvas = Canvas.createCanvas(4, 4);
    const canvasImage = await Canvas.loadImage(imageBuffer);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // NOTE: a little hacky but hopefully this allows us to prioritize getting things within a background
    ctx.drawImage(canvasImage, -1, -1, canvas.width + 2, canvas.height + 2);

    // grab the center pixel
    // DISCLOSURE: This bit is ai
    // Calculate the center pixel's RGB value and format as CSS rgb()
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const centerX = Math.floor(canvas.width / 2);
    const centerY = Math.floor(canvas.height / 2);
    const idx = (centerY * canvas.width + centerX) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // now this is the color we wanna save (this is a hex code)
    const color = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    return color;
};

module.exports = getProminentColor;
