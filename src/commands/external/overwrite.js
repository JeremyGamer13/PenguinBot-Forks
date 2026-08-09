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

                // TODO: We can probably use the grabbed background color to find the font color in this text string, making the letter scan unnecessary
                // NOTE: this object list seems to get it to actually mark each letter inside of "letter"
                console.log("objdtc");
                const objects = await ObjectDetection.predict(textSegmentPath, ["text", "word", "letter", "character", "alphabet", "punctuation"]);
                console.log("objdone");

                // if the dumb model didnt find any letters then just add a default box that covers the whole text string
                const fullBox = [0, 0, width, height];
                const letters = objects.letter || [];
                if (!letters[0])
                    letters[0] = { box: fullBox };

                // search for the font colors using each letter
                const plausibleFontColors = [];
                for (const letter of letters) {
                    const lWidth = letter.box[2] - letter.box[0];
                    const lHeight = letter.box[3] - letter.box[1];

                    // get the font color from each letter
                    colorCtx.drawImage(resizedImage, letter.box[0], letter.box[1], lWidth, lHeight, 0, 0, colorCanvas.width, colorCanvas.height);

                    const fontColorDrawnBuffer = colorCanvas.toBuffer("image/png");
                    const fontColorProminent = await getProminentColor(fontColorDrawnBuffer);
                    plausibleFontColors.push(fontColorProminent);
                }

                // DISCLOSURE: ai
                // grab plausible background colors from the edges pad pixels away from the full textString
                // NOTE: Maybe this could be cahnged later but for now i'd assume this is good enough
                const pad = 10;
                const plausibleBackgroundColors = [];
                const minX = Math.max(0, Math.floor(box.box[0] - pad));
                const minY = Math.max(0, Math.floor(box.box[1] - pad));
                const maxX = Math.min(canvas.width, Math.ceil(box.box[2] + pad));
                const maxY = Math.min(canvas.height, Math.ceil(box.box[3] + pad));

                const boxWidth = maxX - minX;
                const boxHeight = maxY - minY;

                if (boxWidth > 0 && boxHeight > 0) {
                    const imgData = ctx.getImageData(minX, minY, boxWidth, boxHeight);
                    const data = imgData.data;

                    const addPixel = (x, y) => {
                        const localX = x - minX;
                        const localY = y - minY;
                        if (localX >= 0 && localX < boxWidth && localY >= 0 && localY < boxHeight) {
                            const index = (localY * boxWidth + localX) * 4;
                            const r = data[index];
                            const g = data[index + 1];
                            const b = data[index + 2];
                            const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                            plausibleBackgroundColors.push(hex);
                        }
                    };

                    // this adds the rows top &^ bottom
                    for (let x = minX; x <= maxX; x++) {
                        addPixel(x, minY);
                        addPixel(x, maxY);
                    }
                    // this adds the columns left & right
                    for (let y = minY; y <= maxY; y++) {
                        addPixel(minX, y);
                        addPixel(maxX, y);
                    }
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

                // enforce contrast between font and background colors
                // DISCLOSURE: ai
                const [lFont, aFont, bFont] = cssColor.convert.colorToOklab(bestFontColor);
                const [lBg, aBg, bBg] = cssColor.convert.colorToOklab(bestBgColor);
                const colorDist = Math.hypot(lFont - lBg, aFont - aBg, bFont - bBg);

                // this isnt ai
                // if colors are too similar, we make the text brighter & bg darker (or the opposite) depending on how similar they are
                console.log("contrast:", colorDist);
                let finalFontColor = bestFontColor;
                let finalBgColor = bestBgColor;
                if (colorDist <= 0.5) {
                    // NOTE: Its likely that the background only needs to be affected aswell if the similarity is < 0.2
                    const fontShouldBeCloserToBlack = lBg > 0.5;
                    const hslFont = cssColor.convert.colorToHsl(bestFontColor);
                    const hslBg = cssColor.convert.colorToHsl(bestBgColor);
                    const mixingColorFont = fontShouldBeCloserToBlack ? 0 : 100;
                    const mixingColorBg = fontShouldBeCloserToBlack ? 100 : 0;
                    // intensity, closer to 0 = less mix, closer to 1 = more mix
                    const mixingIntensityFont = 1 - (colorDist * 2);
                    const mixingIntensityBg = colorDist <= 0.2 ? 1 - (colorDist * 5) : 0;
                    // this uses the same interpolation as the tweening extension; we just move S and L closer to mixingColor by mixingIntensity
                    const finalFontColorArr = [hslFont[0], hslFont[1], mixingIntensityFont * (mixingColorFont - hslFont[2]) + hslFont[2]];
                    const finalBgColorArr = [hslBg[0], hslBg[1], mixingIntensityBg * (mixingColorBg - hslBg[2]) + hslBg[2]];
                    const finalFontColorCss = `hsl(${finalFontColorArr[0]} ${finalFontColorArr[1]}% ${finalFontColorArr[2]}%)`;
                    const finalBgColorCss = `hsl(${finalBgColorArr[0]} ${finalBgColorArr[1]}% ${finalBgColorArr[2]}%)`;
                    finalFontColor = cssColor.convert.colorToHex(finalFontColorCss);
                    finalBgColor = cssColor.convert.colorToHex(finalBgColorCss);
                }

                // ok all that silly ai math got us here so we can do this
                const fontColor = finalFontColor;
                const backgroundColor = finalBgColor;

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