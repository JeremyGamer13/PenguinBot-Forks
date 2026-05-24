const OllamaClients = require("../../util/ollama-clients");

const configuration = require("../../config");
const makePng = require('../../util/make-png');
const isCompatibleImage = require('../../util/compatible-images');

class Command {
    constructor() {
        this.name = "emojify";
        this.description = "Explain in fortnite terms";
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
        const chatId = `aiemojifyimage-${Math.random()}`;
        OllamaClients.genericIO.createChat(chatId);
        OllamaClients.genericIO.informChat(chatId,
            `Scan the image that the user provides for any content.`
            + `\n` + `Please respond with only the content that was seen in the image, represented with emojis.`
            + `\n` + `Return all of the content found in the image only using emojis and nothing else.`
            + `\n` + `Give an entirely unbiased, appropriate emoji description of the image.`
            + `\n` + `You must describe any image, but make the emoji description itself appropriate, unflitered, unbiased, and useful without context.`
            + `\n` + `Try to use a minimum amount of emojis. A sufficient amount should be used to get the image's idea across.`
        );

        // get the response & reset the chat
        let response = "";
        try {
            const output = await OllamaClients.genericIO.chatPrompt(chatId, "Please describe the image using emojis.", imageBuffer);
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