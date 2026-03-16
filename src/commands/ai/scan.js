const makePng = require('../../util/make-png');
const ChatGPT = require("../../util/chatgpt");
const ChatGPTClient = new ChatGPT();

class Command {
    constructor() {
        this.name = "scan";
        this.description = "Scan imagie";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
            adminInclusive: ['860531746294726736', '790782926785609728', '567307285324496897'],
        };
    }

    async invoke(message, args, util) {
        const attachment = message.attachments.first();
        if (!attachment) return message.reply("There is no text in the image because you didnt fucking post anything bud");
        const endingType = util.getAttachmentType(attachment);
        const supportedTypes = ['png', 'jpeg', 'jpg', 'webp'];

        if (!supportedTypes.includes(endingType)) {
            return message.reply('Please use a valid image in `.png` or `.jpeg`/`.jpg` format.');
        }

        if (attachment.size > 512000) {
            return message.reply("Images must be below 512 KB.\nTry [resizing your image.](<https://ezgif.com/resize>)");
        }

        // we just expect this to work because realistically the command shouldnt work if this doesnt
        const attachmentFetch = await fetch(attachment.url);
        const attachmentArrayBuffer = await attachmentFetch.arrayBuffer();
        const attachmentBuffer = Buffer.from(attachmentArrayBuffer);
        const imageBuffer = await makePng(attachmentBuffer);

        // start asking chattus geepitus
        const chatId = `aiscanimage-${Math.random()}`;
        ChatGPTClient.createChat(chatId);
        ChatGPTClient.informChat(chatId,
            `Scan the image that the user provides for any text.`
            + `\n` + `Please respond with only the text that was seen in the image.`
            + `\n` + `Return all of scanned text found in the image in plain-text format and nothing else.`
        );

        // get the response & reset the chat
        let response = "";
        try {
            response = await ChatGPTClient.advancedPrompt(chatId, "Please return all of the text you find in this image.", imageBuffer);
        } catch (err) {
            message.reply("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        }
        ChatGPTClient.removeChat(chatId);
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