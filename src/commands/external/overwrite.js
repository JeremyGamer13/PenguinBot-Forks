const fs = require("fs/promises");
const path = require("path");

const discord = require("discord.js");

const Canvas = require('canvas');
const cssColor = require("@asamuzakjp/css-color");

const resizePng = require("../../util/resize-png.js");
const TempFolder = require('../../util/temp-folder.js');
const ObjectDetection = require('../../util/object-detection.js');
const getProminentColor = require("../../util/get-prominent-color.js");

class Command {
    constructor() {
        this.name = "overwrite";
        this.description = "Writes your text over the text in the image given.";
        this.attributes = {
            unlisted: false,
            lockedToCommands: true,
            permission: 0,
        };
    }

    async handle(message, args, util) {
        const overwrittenText = args.join(" ").trim();
        if (overwrittenText.length <= 0) return message.reply("you need to type shit to write on there");
        if (util.getPermissionLevel(message) < 4 && !util.automodAllows(overwrittenText, true))
            return message.reply("Stop that right now");

        const [imageBuffer] = await util.getInputImagesForCommand(message);
        if (!imageBuffer) return;
        
        // actually start doing stuff
        console.log("overwrite cmd");
        const jobName = TempFolder.makeTempName("overwrite");
        const temporaryFolder = new TempFolder(jobName);
        await temporaryFolder.createAndDestroy(async (tempDir) => {
            const resizedImage = await resizePng(imageBuffer, 2048 * 2048);
            const image = await Canvas.loadImage(resizedImage);

            // draw the image resized to object detect it
            const canvas = Canvas.createCanvas(image.width, image.height);
            const ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

            // download
            const imagePath = path.join(tempDir, "image.png");
            await fs.writeFile(imagePath, canvas.toBuffer("image/png"));

            // look at the image
            await message.channel.sendTyping();

            // NOTE: I believe mentioning unnecessary objects can help it find sub-elements important
            console.log("objdtc");
            const objects = await ObjectDetection.predict(imagePath, ["text", "writing", "letter"]);
            console.log("objdone");
            
            const textStrings = objects.text;
            if (!textStrings) return message.reply("There no thing to write over");

            // now we need to find the font color and bg color. we'll grab the letters with more object detection & use a small canvas for grabbing the main color
            const colorCanvas = Canvas.createCanvas(6, 6);
            const colorCtx = colorCanvas.getContext("2d");
            for (const box of textStrings) {
                const width = Math.max(1, box.box[2] - box.box[0]);
                const height = Math.max(1, box.box[3] - box.box[1]);

                // perform that object detection
                // NOTE: we just assume the text is longer than it is tall
                const textCanvas = Canvas.createCanvas(width, height);
                const textCtx = textCanvas.getContext("2d");
                textCtx.drawImage(image, box.box[0], box.box[1], width, height, 0, 0, textCanvas.width, textCanvas.height);

                // save the text image
                const textSegmentPath = path.join(tempDir, "textsegment.png");
                const resizedSegment = await resizePng(textCanvas.toBuffer("image/png"), 640 * 640);
                const resizedImage = await Canvas.loadImage(resizedSegment);
                await fs.writeFile(textSegmentPath, resizedSegment);

                // NOTE: this object list seems to get it to actually mark each letter inside of "letter"
                console.log("objdtc");
                const objects = await ObjectDetection.predict(textSegmentPath, ["text", "word", "letter", "character", "alphabet", "punctuation"]);
                console.log("objdone");

                // if the dumb model didnt find any letters then just add a default box that covers the whole text string
                const fullBox = [0, 0, width, height];
                const letters = objects.letter || [fullBox];
                if (!letters[0])
                    letters[0] = { box: fullBox };

                // search for the font colors using the whole letter, and the background color through the corner colors
                // NOTE: this is probably stinky smelly low performance code to avoid duplicating prominent color grabbing code
                // NOTE: we could do a complicated thing by sampling everywhere AROUND the letters, but i dont feel like doing that
                const plausibleFontColors = [];
                const plausibleBackgroundColors = [];
                for (const letter of letters) {
                    const width = letter.box[2] - letter.box[0];
                    const height = letter.box[3] - letter.box[1];
                    
                    // first get the font color from each letter
                    colorCtx.drawImage(resizedImage, letter.box[0], letter.box[1], width, height, 0, 0, colorCanvas.width, colorCanvas.height);

                    const fontColorDrawnBuffer = colorCanvas.toBuffer("image/png");
                    const fontColorProminent = await getProminentColor(fontColorDrawnBuffer);
                    plausibleFontColors.push(fontColorProminent);

                    // now try to get the background colors from the corners, draw each corner in the corners of the colorCanvas
                    colorCtx.drawImage(resizedImage, letter.box[0], letter.box[1], 1, 1, 0, 0, colorCanvas.width / 2, colorCanvas.height / 2);
                    colorCtx.drawImage(resizedImage, letter.box[0] + (width - 1), letter.box[1], 1, 1, colorCanvas.width / 2, 0, colorCanvas.width / 2, colorCanvas.height / 2);
                    colorCtx.drawImage(resizedImage, letter.box[0], letter.box[1] + (height - 1), 1, 1, 0, colorCanvas.height / 2, colorCanvas.width / 2, colorCanvas.height / 2);
                    colorCtx.drawImage(resizedImage, letter.box[0] + (width - 1), letter.box[1] + (height - 1), 1, 1, colorCanvas.width / 2, colorCanvas.height / 2, colorCanvas.width / 2, colorCanvas.height / 2);

                    const bgColorDrawnBuffer = colorCanvas.toBuffer("image/png");
                    const bgColorProminent = await getProminentColor(bgColorDrawnBuffer);
                    plausibleBackgroundColors.push(bgColorProminent);
                }

                // now get the font color and background color from the list of plausible font & bg colors.
                // DISCLOSURE: local gpt-oss ai did this because holy i dont know how the hell to do this type of math
                // Determine the most representative font and background colors
                const avgFontOklab = plausibleFontColors.reduce((acc, col) => {
                    const [l, a, b] = cssColor.convert.colorToOklab(col);
                    return { l: acc.l + l, a: acc.a + a, b: acc.b + b };
                }, { l: 0, a: 0, b: 0 });
                const fontCount = plausibleFontColors.length || 1;
                const meanFontOklab = [avgFontOklab.l / fontCount, avgFontOklab.a / fontCount, avgFontOklab.b / fontCount];
                let bestFontColor = plausibleFontColors[0] || "#FFFFFF";
                let minFontDist = Infinity;
                for (const col of plausibleFontColors) {
                    const [l, a, b] = cssColor.convert.colorToOklab(col);
                    const dist = Math.hypot(l - meanFontOklab[0], a - meanFontOklab[1], b - meanFontOklab[2]);
                    if (dist < minFontDist) {
                        minFontDist = dist;
                        bestFontColor = col;
                    }
                }

                const avgBgOklab = plausibleBackgroundColors.reduce((acc, col) => {
                    const [l, a, b] = cssColor.convert.colorToOklab(col);
                    return { l: acc.l + l, a: acc.a + a, b: acc.b + b };
                }, { l: 0, a: 0, b: 0 });
                const bgCount = plausibleBackgroundColors.length || 1;
                const meanBgOklab = [avgBgOklab.l / bgCount, avgBgOklab.a / bgCount, avgBgOklab.b / bgCount];
                let bestBgColor = plausibleBackgroundColors[0] || "#000000";
                let minBgDist = Infinity;
                for (const col of plausibleBackgroundColors) {
                    const [l, a, b] = cssColor.convert.colorToOklab(col);
                    const dist = Math.hypot(l - meanBgOklab[0], a - meanBgOklab[1], b - meanBgOklab[2]);
                    if (dist < minBgDist) {
                        minBgDist = dist;
                        bestBgColor = col;
                    }
                }

                // ok all that silly ai math got us here so we can do this
                const fontColor = bestFontColor;
                const backgroundColor = bestBgColor;

                // draw bg
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(box.box[0], box.box[1], width, height);

                // draw text
                ctx.font = `bold ${height}px Arial`;
                ctx.textBaseline = "top";
                ctx.fillStyle = fontColor;
                ctx.fillText(overwrittenText, box.box[0], box.box[1], width);
            }

            console.log("overwrite done");
            const drawnBuffer = canvas.toBuffer("image/png");
            message.reply({
                content: `Generated by <@${message.author.id}>`,
                files: [drawnBuffer],
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: false
                }
            });
        });
    }
    async invoke(message, args, util) {
        const canDo = util.request("heavyExternalStuff");
        if (!canDo) return message.reply("disabled (im probably playing a game)");

        await this.handle(message, args, util);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;