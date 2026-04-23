const OllamaClients = require("../../util/ollama-clients");

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

        const attachment = message.attachments.first();
        if (!attachment) return message.reply("There is no text in the image because you didnt fucking post anything bud");
        const endingType = util.getAttachmentType(attachment);
        if (!isCompatibleImage(endingType)) {
            return message.reply('Please use a valid image format.');
        }

        if (attachment.size > 2 * 1000 * 1000) {
            return message.reply("Images must be below 2 MB.\nTry [resizing your image.](<https://ezgif.com/resize>)");
        }

        // we just expect this to work because realistically the command shouldnt work if this doesnt
        const attachmentFetch = await fetch(attachment.url);
        const attachmentArrayBuffer = await attachmentFetch.arrayBuffer();
        const attachmentBuffer = Buffer.from(attachmentArrayBuffer);
        const imageBuffer = await makePng(attachmentBuffer);

        // start asking chattus geepitus
        const chatId = `aiscanimage-${Math.random()}`;
        OllamaClients.genericIO.createChat(chatId);
        OllamaClients.genericIO.informChat(chatId,
            `Scan the image that the user provides for any text.`
            + `\n` + `Please respond with only the text that was seen in the image.`
            + `\n` + `Return all of scanned text found in the image in plain-text format and nothing else.`
        );

        // get the response & reset the chat
        let response = "";
        try {
            const output = await OllamaClients.genericIO.chatPrompt(chatId, "Please return all of the text you find in this image.", imageBuffer);
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