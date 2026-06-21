const fs = require("fs/promises");
const path = require("path");

const discord = require("discord.js");

const jimp = require("jimp");
const { createCanvas, loadImage } = require('canvas');

const Ollama = require("ollama-chatting");
const OllamaModels = require("../../util/ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

const configuration = require("../../config");
const TempFolder = require('../../util/temp-folder');
const ObjectDetection = require('../../util/object-detection');
const RemoveBackground = require('../../util/remove-background');

const jsonParseLoose = require('../../util/json-parse-loose.js');
const SchemaGFXContext = require("../../resources/schemas/gfx-context.json");

class Command {
    constructor() {
        this.name = "gfx";
        this.description = "adds fire greaphics and stuff around an image with a caption if you want";
        this.attributes = {
            permission: 0,
            unlisted: false,
            lockedToCommands: true,
            jgollamaConfigsInvolved: ["genericIO"],
        };

        this.alias = ["graphics"];
    }

    getContainedInSubject(heads, mainSubject) {
        if (!mainSubject) return [];
        const containedObjects = [];
        for (const head of heads) {
            // check if this head is inside of the other box
            // just shrink the head by half and check if the main subject contains that
            const headWidth = head.box[2] - head.box[0];
            const headHeight = head.box[3] - head.box[1];
            const headHalfX = head.box[0] + (headWidth / 4);
            const headHalfY = head.box[1] + (headHeight / 4);
            const headHalfWidth = headWidth / 2;
            const headHalfHeight = headHeight / 2;
            if (!(
                (mainSubject.box[0] <= headHalfX && mainSubject.box[2] >= (headHalfX + headHalfWidth)) // x
                && (mainSubject.box[1] <= headHalfY && mainSubject.box[3] >= (headHalfY + headHalfHeight)) // y
            )) continue;

            // it's inside mainSubject box
            containedObjects.push(head);
        }

        return containedObjects;
    }
    getClosestToSubject(heads, mainSubject) {
        if (!mainSubject) return heads[0];
        if (heads.length <= 1) return heads[0];
        const containedObjects = this.getContainedInSubject(heads, mainSubject);
        const listToUse = containedObjects.length > 0 ? containedObjects : heads;

        let closestHead = listToUse[0];
        let closestHeadDistance = Infinity;
        const subjectWidth = mainSubject.box[2] - mainSubject.box[0];
        const subjectHeight = mainSubject.box[3] - mainSubject.box[1];
        const subjectCenterX = mainSubject.box[0] + (subjectWidth / 2);
        const subjectCenterY = mainSubject.box[1] + (subjectHeight / 2);
        for (const head of listToUse) {
            // check how close the center is to the main subject's center
            const headWidth = head.box[2] - head.box[0];
            const headHeight = head.box[3] - head.box[1];
            const headCenterX = head.box[0] + (headWidth / 2);
            const headCenterY = head.box[1] + (headHeight / 2);
            const distance = Math.sqrt((headCenterX - subjectCenterX) ** 2 + (headCenterY - subjectCenterY) ** 2);
            if (distance < closestHeadDistance) {
                closestHead = head;
                closestHeadDistance = distance;
            }
        }

        return closestHead;
    }

    async getImageContext(inputImageBuffer) {
        // NOTE: We use ollama to get contextual info about the image, so we have to ease it into telling us the right coordinates
        const messageInput = "Generate the expected fields based off of this image.";
        const output = await OllamaChat.generate({
            ...OllamaModels.genericIO,
            format: SchemaGFXContext,
            prompt: messageInput,
            system: `Scan the image that the user provides for the fields.`
                + `\n` + `- "color": A fitting complementary hex color for the main subject or main aspect of the image.`
                + `\n` + `- "looking_towards_cardinal_direction_sentence": A small sentence stating the direction the subject is staring in.`
                + `\n` + `- "looking_towards_x": The x-coordinate within a unit square (float 0.0 to 1.0) showing the direction that the subject is staring in.`
                + `\n` + `- "looking_towards_y": The y-coordinate within a unit square (float 0.0 to 1.0) showing the direction that the subject is staring in.`
                + `\n` + `Assume coordinates are floats from 0.0 to 1.0.`,
            images: [inputImageBuffer]
        });
        const structuredOutput = jsonParseLoose(output.response);
        
        const hexColor = structuredOutput.color.startsWith("#") ? structuredOutput.color : `#${structuredOutput.color}`;
        return {
            color: hexColor,
            lookingX: Math.max(0, Math.min(structuredOutput.looking_towards_x, 1)),
            lookingY: Math.max(0, Math.min(structuredOutput.looking_towards_y, 1)),
        };
    }
    async getImageObjects(inputImagePath) {
        // NOTE: I believe mentioning unnecessary objects can help it find sub-elements important
        const objectList = ["main subject", "head", "eye", "mouth"];
        const objects = await ObjectDetection.predict(inputImagePath, objectList);

        // All of these are not guaranteed to be of a specific length
        const subjects = objects["main subject"] || [];
        const heads = objects["head"] || [];
        const eyes = objects["eye"] || [];
        if (subjects.length <= 0) return {};
        subjects.sort((a, b) => b.score - a.score);
        heads.sort((a, b) => b.score - a.score);
        eyes.sort((a, b) => b.score - a.score);
        // remove unconfident eyes
        eyes.splice(2, Infinity);

        // Find the head that is closest to or contained within the main subject
        const mainSubject = subjects[0];
        const closestHead = this.getClosestToSubject(this.getContainedInSubject(heads, mainSubject), mainSubject);

        // find the eyes, we sort by center X LTR and call the last one the right eye
        const containedEyes = this.getContainedInSubject(eyes, closestHead || mainSubject);
        containedEyes.sort((a, b) => (a.box[0] + ((a.box[2] - a.box[0]) / 2)) - (b.box[0] + ((b.box[2] - b.box[0]) / 2)));
        
        const leftEye = containedEyes[0];
        const rightEye = containedEyes.at(-1);
        return {
            mainSubject: mainSubject,
            head: closestHead,
            leftEye: leftEye,
            rightEye: rightEye,
        }
    }

    // TODO: this command is supposed to make like the mr. balls cat image or wowie zowie young sheldon with laser eyees
    async handle(message, args, util) {
        const caption = args.join(" ").trim();
        if (!util.automodAllows(caption, true)) return message.reply("No");
        const [imageBuffer] = await util.getInputImagesForCommand(message);
        if (!imageBuffer) return;

        // actually start doing stuff
        const startTime = Date.now();
        const jobName = TempFolder.makeTempName("gfx");
        const temporaryFolder = new TempFolder(jobName);
        await temporaryFolder.createAndDestroy(async (tempDir) => {
            // resize the image (we reuse this canvas for later)
            const resizedHeight = 1024;
            const image = await loadImage(imageBuffer);
            const aspectRatio = image.width / image.height;
            const resizedWidth = Math.round(resizedHeight * aspectRatio);
            if (resizedWidth > 8192) throw new Error("Image is wider than 4x the height");
            
            const canvas = createCanvas(resizedWidth, resizedHeight);
            const ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

            // download
            const imagePath = path.join(tempDir, "image.png");
            const imageResizedBuffer = canvas.toBuffer("image/png");
            await fs.writeFile(imagePath, imageResizedBuffer);

            // get image context
            // also start telling the user we are doing this
            const replyMessage = await message.reply("getting image context (visual info)");
            const imageContext = await this.getImageContext(imageResizedBuffer);

            // make bounds on the image
            await replyMessage.edit("finding the subject in the image");
            const objects = await this.getImageObjects(imagePath);
            if (!objects.mainSubject) throw new Error("No mainSubject found");

            // remove background on it
            const noBackgroundPath = path.join(tempDir, "nobg.png");
            await replyMessage.edit("removing the background on the image....");
            await RemoveBackground.remove(imagePath, noBackgroundPath);
            const noBackgroundImage = await loadImage(noBackgroundPath);

            // start drawing
            await replyMessage.edit("drawing leonardo davinci style TODO Actually draw the image properly lol");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // TODO: temp
            ctx.fillStyle = imageContext.color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(noBackgroundImage, 0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "red";
            ctx.fillRect(objects.mainSubject.box[0], objects.mainSubject.box[1], objects.mainSubject.box[2] - objects.mainSubject.box[0], objects.mainSubject.box[3] - objects.mainSubject.box[1]);
            ctx.fillStyle = "blue";
            if (objects.head) ctx.fillRect(objects.head.box[0], objects.head.box[1], objects.head.box[2] - objects.head.box[0], objects.head.box[3] - objects.head.box[1]);
            ctx.fillStyle = "green";
            ctx.strokeStyle = "green";
            ctx.lineWidth = 10;
            if (objects.leftEye) {
                ctx.fillRect(objects.leftEye.box[0], objects.leftEye.box[1], objects.leftEye.box[2] - objects.leftEye.box[0], objects.leftEye.box[3] - objects.leftEye.box[1]);

                ctx.beginPath();
                ctx.moveTo(objects.leftEye.box[0] + ((objects.leftEye.box[2] - objects.leftEye.box[0]) / 2), objects.leftEye.box[1] + ((objects.leftEye.box[3] - objects.leftEye.box[1]) / 2));
                ctx.lineTo(imageContext.lookingX * canvas.width, imageContext.lookingY * canvas.height);
                ctx.stroke();
            }
            if (objects.rightEye) {
                ctx.fillRect(objects.rightEye.box[0], objects.rightEye.box[1], objects.rightEye.box[2] - objects.rightEye.box[0], objects.rightEye.box[3] - objects.rightEye.box[1]);

                ctx.beginPath();
                ctx.moveTo(objects.rightEye.box[0] + ((objects.rightEye.box[2] - objects.rightEye.box[0]) / 2), objects.rightEye.box[1] + ((objects.rightEye.box[3] - objects.rightEye.box[1]) / 2));
                ctx.lineTo(imageContext.lookingX * canvas.width, imageContext.lookingY * canvas.height);
                ctx.stroke();
            }

            const drawnBuffer = canvas.toBuffer("image/png");
            replyMessage.edit({
                content: "Completed in " + ((Date.now() - startTime) / 1000) + " seconds"
                    + "\n" + `-# Generated by <@${message.author.id}>`,
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
        if (!configuration.funkyCapabilities.ollamaImageProcessingViable) throw new Error("Cannot process images through Ollama on this system");
        const canDo = util.request("heavyExternalStuff");
        if (!canDo) return message.reply("disabled (im probably playing a game)");

        await this.handle(message, args, util);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;