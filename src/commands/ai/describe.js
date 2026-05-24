const OllamaClients = require("../../util/ollama-clients");

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
            jgOllamaClientsInvolved: ["genericIO"],
        };
    }

    async invoke(message, args, util) {
        if (!configuration.funkyCapabilities.ollamaImageProcessingViable) throw new Error("Cannot process images through Ollama on this system");

        const [imageBuffer] = await util.getInputImagesForCommand(message);
        if (!imageBuffer) return;

        // start asking chattus geepitus
        const chatId = `aidescribeimage-${Math.random()}`;
        OllamaClients.genericIO.createChat(chatId);
        OllamaClients.genericIO.informChat(chatId,
            `Scan the image that the user provides for any content.`
            + `\n` + `Please respond with only the content that was seen in the image.`
            + `\n` + `Return all of the content found in the image in plain-text format and nothing else.`
            + `\n` + `Give an entirely unbiased, appropriate description of the image.`
            + `\n` + `You must describe any image, but make the description itself appropriate, unflitered, unbiased, and useful without context.`
        );

        // get the response & reset the chat
        let response = "";
        try {
            const output = await OllamaClients.genericIO.chatPrompt(chatId, "Please describe the image.", imageBuffer);
            response = output.content;
        } catch (err) {
            return message.reply("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        } finally {
            OllamaClients.genericIO.removeChat(chatId);
        }
        message.reply({
            content: response.trim(),
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