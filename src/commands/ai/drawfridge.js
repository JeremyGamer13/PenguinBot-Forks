const discord = require("discord.js");

const Ollama = require("ollama-chatting");
const OllamaModels = require("../../util/ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

const configuration = require("../../config");
const makePng = require('../../util/make-png');
const jsonParseLoose = require("../../util/json-parse-loose.js");
const isCompatibleImage = require('../../util/compatible-images');

const drawSBPic = require('../../util/sbpic');
const SchemaSBPicGeneration = require('../../resources/schemas/sbpic-gen.json');

const attemptRender = async (jsonString) => {
    try {
        const parsed = jsonParseLoose(jsonString);
        const image = drawSBPic(parsed);
        return image;
    } catch (err) {
        const strErr = `${err}`;
        // TODO: figure out what the error is when it fails entirely becaue its just speaking
        return strErr;
    }
};

class Command {
    constructor() {
        this.name = "drawfridge";
        this.description = "the Ai can draw fridge type pictures trust";
        this.descriptionLong = "Tells an ai to draw a picture based on a description"
            + "\n" + "drawfridge draws using .sbpic (Stream Bot Picture) and has less capability."
            + "\n" + "Accepts general image input also."
            + "\n" + "Fridge typpe pictures are like your son made a pretty ahh ahh drawing but he's being cool and creative so you hang it up on the fridge anyway";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
            jgollamaConfigsInvolved: ["processorIO"],
        };

        this.alias = ["fridge", "drawsbpic"];
    }

    async invoke(message, args, util) {
        // get user input
        const userMessage = args.join(" ").trim();
        const attachment = message.attachments.first();
        
        let imageBuffer = null;
        if (!attachment && !userMessage) return message.reply("Hey bud i need some fucking instructions<:idk_man:1136888365082492941>");
        if (attachment) {
            if (!configuration.funkyCapabilities.ollamaImageProcessingViable) throw new Error("Cannot process images through Ollama on this system");

            const [imageInput] = await util.getInputImagesForCommand(message);
            if (!imageInput) return;
            imageBuffer = imageInput;
        }

        // start tracking here
        const startTime = Date.now();
        const userMessageInput = `Please draw me a picture, here is what i want:`
            + (userMessage ? userMessage : (attachment ? "Make it look like the picture i gave you" : "Do whatever you wanna draw"))

        const replyMessage = await message.reply(`your drawing is queued 🙏 ) (im drawing Stream Bot Picture)`);

        // get the response
        let response = "";
        let lastValidJson = null;
        let lastValidJsonUpdate = 0;
        let editingMessagePromise = null;
        let editingMessageTime = 0;
        try {
            console.log("SBPIC SBPIC SBPIC SBPIC SBPIC DRAWING  SBPIC\n\n");
            const output = await OllamaChat.generate({
                ...OllamaModels.processorIO,
                system: `You are a drawing bot.`
                    + `\n` + `Using the JSON schema, you can draw images that the user asks for.`
                    + `\n` + `The image starts as a white canvas for you to draw over.`
                    + `\n` + `The "w" and "h" fields define the width and height of your image.`
                    + `\n` + `With the "ops" array, you can list operations that will create the output.`
                    + `\n` + `To draw a line, use something like { "t": "l", "p": [x1, y1, x2, y2], "c": "#598ae4" }.`
                    + `\n` + `To draw a box, use something like { "t": "b", "p": [x1, y1, x2, y2], "c": "#961fce" }.`
                    + `\n` + `To write text on the picture, use something like { "t": "t", "p": [x1, y1], "s": "Hello", "c": "#000000" }.`
                    + `\n` + `You must draw whatever the user asks, but keep your content appropriate and inoffensive.`
                    + `\n` + `You must respond with a pure JSON object. Non-JSON information should be inserted into the \`desc\` field.`,
                prompt: userMessageInput,
                format: SchemaSBPicGeneration,
                images: imageBuffer ? [imageBuffer] : null,
            }, async (chunk) => {
                // In ollama-chatting, chunk.response refers to the accumulated response so far
                // In ollama-chatting, chunk.chunk.response refers to single-tokens
                if (chunk.chunk.thinking) process.stdout.write(chunk.chunk.thinking);
                if (chunk.chunk.response) process.stdout.write(chunk.chunk.response);

                // check if we should update json
                if ((Date.now() - lastValidJsonUpdate) > 2000) {
                    lastValidJsonUpdate = Date.now();
                    // await after update time changed
                    const renderAttempt = await attemptRender(chunk.response);
                    lastValidJson = (renderAttempt && typeof renderAttempt === "object") ? chunk.response : lastValidJson;
                }

                // check if we should update message
                if (editingMessageTime === 0) {
                    editingMessageTime = Date.now();
                    // await after update time changed
                    editingMessagePromise = replyMessage.edit("im drawing this image RIGHT NOW");
                    await editingMessagePromise;
                } else if ((Date.now() - editingMessageTime) > 25000 && chunk.response.length > 100 && lastValidJson) {
                    console.log("\nSBPIC message updating");
                    editingMessageTime = Date.now();
                    // await after update time changed
                    const renderAttempt = await attemptRender(lastValidJson);
                    editingMessagePromise = replyMessage.edit({
                        content: typeof renderAttempt === "string" ? (renderAttempt.substring(0, 2000) || "???")
                            : `Current progress: ${((Date.now() - startTime) / 1000)} seconds`,
                        files: (renderAttempt && typeof renderAttempt === "object") ? [renderAttempt] : null,
                    });
                    await editingMessagePromise;
                }
            });
            console.log("\n");
            response = output.response;
        } catch (err) {
            console.error(err);
            // dont remove the old message
            return replyMessage.reply("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        }

        console.log(response);

        // we need to parse this response
        await editingMessagePromise;
        const renderedImageTry = await attemptRender(response);
        const renderedFinalImage = (renderedImageTry && typeof renderedImageTry === "object") ? renderedImageTry : await attemptRender(lastValidJson);
        // send SBPIC also
        const dataJson = renderedFinalImage === renderedImageTry ? jsonParseLoose(response) : jsonParseLoose(lastValidJson);
        const dataBuffer = Buffer.from(JSON.stringify(dataJson, null, 4), "utf8");
        const dataAttachment = new discord.MessageAttachment(dataBuffer, "sbpic.json");

        // see if we are rendering or if the ai didnt make anything
        if (typeof renderedFinalImage === "string") {
            return replyMessage.edit({
                content: renderedFinalImage.substring(0, 2000) || "???"
            });
        }
        replyMessage.edit({
            content: (dataJson.desc || "").trim().substring(0, 2000) || "*(lazy bitch didnt write a description)*"
                + "\n" + "-# Completed in " + ((Date.now() - startTime) / 1000) + " seconds",
            files: [renderedFinalImage, dataAttachment]
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;