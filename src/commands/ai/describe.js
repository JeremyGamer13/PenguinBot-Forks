const OllamaClients = require("../../util/ollama-clients");

const makePng = require('../../util/make-png');
const isCompatibleImage = require('../../util/compatible-images');

class Command {
    constructor() {
        this.name = "describe";
        this.description = "What kind of fruit is this";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
            adminInclusive: ['860531746294726736', '790782926785609728', '567307285324496897'],
        };
    }

    async invoke(message, args, util) {
        const attachment = message.attachments.first();
        if (!attachment) return message.reply("From what i can see I can describe this as Fucking nothing because you didnt post a picture 🎉");
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