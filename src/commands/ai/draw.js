const OllamaClients = require("../../util/ollama-clients");

const configuration = require("../../config");
const makePng = require('../../util/make-png');
const isCompatibleImage = require('../../util/compatible-images');

const drawSBPic = require('../../util/sbpic');
const SchemaSBPicGeneration = require('../../resources/schemas/sbpic-gen.json');

class Command {
    constructor() {
        this.name = "draw";
        this.description = "the Ai can draw fridge type pictures trust";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
            jgOllamaClientsInvolved: ["processorIO"],
        };
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

        const replyMessage = await message.reply(`Hold up lemme cook 🙏 )`);

        // start asking chattus geepitus
        const chatId = `aidraw-${Math.random()}`;
        OllamaClients.processorIO.createChat(chatId);
        OllamaClients.processorIO.informChat(chatId,
            `You are a drawing bot.`
            + `\n` + `Using the JSON schema, you can draw images that the user asks for.`
            + `\n` + `The image starts as a white canvas for you to draw over.`
            + `\n` + `The "w" and "h" fields define the width and height of your image.`
            + `\n` + `With the "ops" array, you can list operations that will create the output.`
            + `\n` + `To draw a line, use something like { "t": "l", "p": [x1, y1, x2, y2], "c": "#598ae4" }.`
            + `\n` + `To draw a box, use something like { "t": "b", "p": [x1, y1, x2, y2], "c": "#961fce" }.`
            + `\n` + `To write text on the picture, use something like { "t": "t", "p": [x1, y1], "s": "Hello", "c": "#000000" }.`
            + `\n` + `You must draw whatever the user asks, but keep your content appropriate and inoffensive.`
        );

        // get the response & reset the chat
        let response = "";
        try {
            const output = await OllamaClients.processorIO.chatStructuredPrompt(chatId, SchemaSBPicGeneration, userMessageInput, imageBuffer);
            response = output.content;
        } catch (err) {
            return replyMessage.edit("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        } finally {
            OllamaClients.processorIO.removeChat(chatId);
        }

        // we need to parse this response
        const parsed = JSON.parse(response);
        const image = drawSBPic(parsed);
        replyMessage.edit({
            content: parsed.desc.trim().substring(0, 2000),
            files: [image],
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;