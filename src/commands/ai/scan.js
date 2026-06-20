const Ollama = require("ollama-chatting");
const OllamaModels = require("../../util/ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

const configuration = require("../../config");
const makePng = require('../../util/make-png');
const isCompatibleImage = require('../../util/compatible-images');

class Command {
    constructor() {
        this.name = "scan";
        this.description = "Scan imagie";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
            jgOllamaClientsInvolved: ["genericIO"],
        };
    }

    async invoke(message, args, util) {
        if (!configuration.funkyCapabilities.ollamaImageProcessingViable) throw new Error("Cannot process images through Ollama on this system");

        const [imageBuffer] = await util.getInputImagesForCommand(message);
        if (!imageBuffer) return;

        // get the response
        try {
            const output = await OllamaChat.generate({
                ...OllamaModels.genericIO,
                prompt: "Please return all of the text you find in this image.",
                system: `Scan the image that the user provides for any text.`
                    + `\n` + `Please respond with only the text that was seen in the image.`
                    + `\n` + `Return all of scanned text found in the image in plain-text format and nothing else.`,
                images: [imageBuffer]
            });
            message.reply({
                content: output.response.trim(),
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        } catch (err) {
            return message.reply("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;