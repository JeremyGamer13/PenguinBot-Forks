const discord = require("discord.js");

const Ollama = require("ollama-chatting");
const OllamaModels = require("../../util/ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

const configuration = require("../../config");
const makePng = require('../../util/make-png');
const svgRepair = require('../../util/svg-repair.js');
const isCompatibleImage = require('../../util/compatible-images');

class Command {
    constructor() {
        this.name = "drawsvg";
        this.description = "Muahahah im PROBLEMATIC MEDIA and i support AI IMAGERY MUAHAHHA 😈😈😈😈😈😈";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
            jgollamaConfigsInvolved: ["svgCoder", "svgCoderImage"],
        };

        this.alias = ["draw", "svg"];
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

        const userMessageInput = `Please draw me a picture, here is what i want:`
            + (userMessage ? userMessage : (attachment ? "Make it look like the picture i gave you" : "Do whatever you wanna draw"))

        const replyMessage = await message.reply(`Hold up lemme cook 🙏 ) (im drawing Scalable Vector Graphics)`);

        // get the response
        let response = "";
        try {
            console.log("SVG SVG SVG SVG SVG DRAWING SVG\n\n");
            // TODO: Ollama is straight up ignoring the image input. We should find a workaround for this.
            const output = await OllamaChat.generate({
                ...(imageBuffer ? OllamaModels.svgCoderImage : OllamaModels.svgCoder),
                system: `You are a drawing bot.`
                    + `\n` + `You must output complete, valid SVG files. Do not provide code fragments or partial snippets.`
                    + `\n` + `Ensure your SVG code is well-structured and includes the proper attributes to ensure the image renders correctly.`
                    + `\n` + `Provide the raw SVG code starting with the <svg> tag and ending with the </svg> tag. Provide the clean, copy-pasteable XML/SVG content directly.`
                    + `\n`
                    + `\n` + `If a request is ambiguous, use your best judgment to create a visually appealing design.`
                    + `\n` + `Focus on clean paths, logical grouping, and effective use of colors or gradients to maximize the visual impact of the vector graphic.`
                    + `\n` + `You must draw whatever the user asks, but keep your content appropriate and inoffensive.`,
                prompt: userMessageInput,
                images: imageBuffer ? [new Uint8Array(imageBuffer)] : null,
            }, (chunk) => {
                if (chunk.chunk.thinking) process.stdout.write(chunk.chunk.thinking);
                if (chunk.chunk.response) process.stdout.write(chunk.chunk.response);
            });
            console.log("\n");
            response = output.response;
        } catch (err) {
            console.error(err);
            return replyMessage.edit("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        }

        // we need to parse this response
        // send SVG also
        console.log("SVG repairing...");
        const parsed = svgRepair(response);
        const dataBuffer = Buffer.from(parsed, "utf8");
        const dataAttachment = new discord.MessageAttachment(dataBuffer, "image.svg");

        try {
            console.log("SVG rendering...");
            const image = await makePng(dataBuffer);
            replyMessage.edit({
                content: "I did it",
                files: [image, dataAttachment],
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        } catch (err) {
            // in this case, we just didnt make any SVG
            if (`${err}`.includes("Input buffer contains unsupported image format")) {
                return replyMessage.edit({
                    content: response.substring(0, 2000) || "Fuck",
                    allowedMentions: {
                        parse: [],
                        users: [],
                        roles: [],
                        repliedUser: true
                    }
                });
            }

            // else, err
            throw err;
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;