const fs = require('fs');
const path = require('path');

const Canvas = require('canvas');

const processFrames = async (data) => {
    const { workerSrc, commandSrc, tempDir, imageUrl, frameCount, frameRate, width, height, args, serializableData } = data;
    
    const commandModule = require(commandSrc);
    const commandClass = new commandModule();

    let image = null;
    if (imageUrl) {
        image = await Canvas.loadImage(imageUrl);
    }
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (commandClass.initialize) {
        await commandClass.initialize(Canvas, canvas, ctx, args, serializableData);
    }

    for (let i = 0; i < frameCount; i++) {
        commandClass.drawFrame(ctx, image, i, frameCount, frameRate, width, height, args, serializableData);

        const framePath = path.join(tempDir, `frame${String(i).padStart(6, '0')}.png`);
        fs.writeFileSync(framePath, canvas.toBuffer("image/png"));
    }
};

const runWorker = async (data) => {
    return await processFrames(data);
};

// FYI, Canvas support is very rough with worker_threads for some reason. We use child_process to work around that.
process.on('message', async (data) => {
    try {
        await runWorker(data);
        process.send({ success: true });
    } catch (err) {
        process.send({ success: false, error: err.message });
    } finally {
        // this process wont close by itself, so we exit with code 0 to denote we successfully finished everything
        process.exit(0);
    }
});

module.exports = runWorker;