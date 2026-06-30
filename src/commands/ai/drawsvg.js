const discord = require("discord.js");

const Ollama = require("ollama-chatting");
const OllamaModels = require("../../util/ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

const configuration = require("../../config");
const makePng = require('../../util/make-png');
const svgRepair = require('../../util/svg-repair.js');
const isCompatibleImage = require('../../util/compatible-images');

const attemptRender = async (svgString) => {
    try {
        const parsed = svgRepair(svgString);
        const dataBuffer = Buffer.from(parsed, "utf8");
        const image = await makePng(dataBuffer);
        return image;
    } catch (err) {
        const strErr = `${err}`;

        // ai is just talking
        if (strErr.includes("Input buffer contains unsupported image format")) return svgString;
        if (strErr.includes("Error: Invalid input")) return svgString;
        if (strErr.includes("Input Buffer is empty")) return svgString;

        // its an actual error
        return strErr;
    }
};

class Command {
    constructor() {
        this.name = "drawsvg";
        this.description = "Muahahah im PROBLEMATIC MEDIA and i support AI IMAGERY MUAHAHHA 😈😈😈😈😈😈";
        this.descriptionLong = "Tells an ai to draw a picture based on a description"
            + "\n" + "drawsvg draws using SVG (Scalable Vector Graphics). May take longer due to complexity but generally looks funny"
            + "\n" + "Accepts general image input also.";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
            jgollamaConfigsInvolved: ["svgCoder", "svgCoderImage"],
        };

        this.usersDrawing = new Set();
        this.alias = ["draw"];
    }

    async invoke(message, args, util) {
        if (this.usersDrawing.has(message.author.id))
            return message.reply("shut the fuck up");

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

        const replyMessage = await message.reply(`your drawing is queued 🙏 ) (im drawing Scalable Vector Graphics)`);

        // get the response
        let response = "";
        let lastValidSvg = null;
        let lastValidSvgUpdate = 0;
        let editingMessagePromise = null;
        let editingMessageTime = 0;
        try {
            console.log("SVG SVG SVG SVG SVG DRAWING SVG\n\n");
            if (this.usersDrawing.has(message.author.id)) throw new Error("This user is queued");
            this.usersDrawing.add(message.author.id);

            const output = await OllamaChat.generate({
                ...(imageBuffer ? OllamaModels.svgCoderImage : OllamaModels.svgCoder),
                system: `You are a drawing bot.`
                    + `\n` + `You must output complete, valid SVG files. Do not provide code fragments or partial snippets.`
                    + `\n` + `Ensure your SVG code is well-structured and includes the proper attributes to ensure the image renders correctly.`
                    + `\n` + `Provide the raw SVG code starting with the <svg> tag and ending with the </svg> tag. Provide the clean, copy-pasteable XML/SVG content directly.`
                    + `\n`
                    + `\n` + `If a request is ambiguous, use your best judgment to create a visually appealing design.`
                    + `\n` + `If a request is extremely inappropriate or sexual, rework the prompt to be safe and abiding by guidelines.`
                    + `\n` + `Focus on clean paths, logical grouping, and effective use of colors or gradients to maximize the visual impact of the vector graphic.`
                    + `\n` + `Use multiple path segments and features to add detail to the image where possible.`
                    + `\n` + `You must draw whatever the user asks, but keep your content appropriate and inoffensive.`,
                prompt: userMessageInput,
                images: imageBuffer ? [new Uint8Array(imageBuffer)] : null,
            }, async (chunk) => {
                // In ollama-chatting, chunk.response refers to the accumulated response so far
                // In ollama-chatting, chunk.chunk.response refers to single-tokens
                if (chunk.chunk.thinking) process.stdout.write(chunk.chunk.thinking);
                if (chunk.chunk.response) process.stdout.write(chunk.chunk.response);
                
                // check if we should update svg
                if ((Date.now() - lastValidSvgUpdate) > 2000) {
                    lastValidSvgUpdate = Date.now();
                    // await after update time changed
                    const renderAttempt = await attemptRender(chunk.response);
                    lastValidSvg = (renderAttempt && typeof renderAttempt === "object") ? chunk.response : lastValidSvg;
                }

                // check if we should update message
                if (editingMessageTime === 0) {
                    editingMessageTime = Date.now();
                    // await after update time changed
                    editingMessagePromise = replyMessage.edit("im drawing this image RIGHT NOW");
                    await editingMessagePromise;
                } else if ((Date.now() - editingMessageTime) > 25000 && chunk.response.length > 100 && lastValidSvg) {
                    console.log("\nSVG message updating");
                    editingMessageTime = Date.now();
                    // await after update time changed
                    const renderAttempt = await attemptRender(lastValidSvg);
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
        } finally {
            this.usersDrawing.delete(message.author.id);
        }

        // we need to parse this response
        await editingMessagePromise;
        const renderedImageTry = await attemptRender(response);
        const renderedFinalImage = (renderedImageTry && typeof renderedImageTry === "object") ? renderedImageTry : (typeof renderedImageTry === "string" && !lastValidSvg ? renderedImageTry : await attemptRender(lastValidSvg));
        // send SVG also
        const dataBuffer = Buffer.from(renderedFinalImage === renderedImageTry ? svgRepair(response) : svgRepair(lastValidSvg), "utf8");
        const dataAttachment = new discord.MessageAttachment(dataBuffer, "image.svg");

        // see if we are rendering or if the ai didnt make anything
        if (typeof renderedFinalImage === "string") {
            return replyMessage.edit({
                content: renderedFinalImage.substring(0, 2000) || "???"
            });
        }
        replyMessage.edit({
            content: "Completed in " + ((Date.now() - startTime) / 1000) + " seconds",
            files: [renderedFinalImage, dataAttachment]
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;