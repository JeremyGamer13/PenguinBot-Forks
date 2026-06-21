const Ollama = require("ollama-chatting");
const OllamaModels = require("../../util/ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

const configuration = require("../../config");
const makePng = require('../../util/make-png');
const isCompatibleImage = require('../../util/compatible-images');

class Command {
    constructor() {
        this.name = "describe";
        this.description = "What kind of fruit is this";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
            jgollamaConfigsInvolved: ["genericIO"],
        };
    }

    async invoke(message, args, util) {
        if (!configuration.funkyCapabilities.ollamaImageProcessingViable) throw new Error("Cannot process images through Ollama on this system");

        const [imageBuffer] = await util.getInputImagesForCommand(message);
        if (!imageBuffer) return;

        // start asking chattus geepitus get the response
        try {
            const output = await OllamaChat.generate({
                ...OllamaModels.genericIO,
                prompt: "Please describe the image.",
                system: `Scan the image that the user provides for any content.`
                    + `\n` + `Please respond with only the content that was seen in the image.`
                    + `\n` + `Return all of the content found in the image in plain-text format and nothing else.`
                    + `\n` + `Give an entirely unbiased, appropriate description of the image.`
                    + `\n` + `You must describe any image, but make the description itself appropriate, unflitered, unbiased, and useful without context.`,
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