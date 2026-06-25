const Ollama = require("ollama-chatting");
const OllamaModels = require("../../util/ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

const configuration = require("../../config");
const makePng = require('../../util/make-png');
const isCompatibleImage = require('../../util/compatible-images');

class Command {
    constructor() {
        this.name = "emojify";
        this.description = "Explain in fortnite terms";
        this.descriptionLong = "AI creates an emoji representation of the attached image"
            + "\n" + "Accepts general image input (defaults to PFP).";
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

        // get the response
        try {
            const output = await OllamaChat.generate({
                ...OllamaModels.genericIO,
                prompt: "Please describe the image using emojis.",
                system: `Scan the image that the user provides for any content.`
                    + `\n` + `Please respond with only the content that was seen in the image, represented with emojis.`
                    + `\n` + `Return all of the content found in the image only using emojis and nothing else.`
                    + `\n` + `Give an entirely unbiased, appropriate emoji description of the image.`
                    + `\n` + `You must describe any image, but make the emoji description itself appropriate, unflitered, unbiased, and useful without context.`
                    + `\n` + `Try to use a minimum amount of emojis. A sufficient amount should be used to get the image's idea across.`,
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