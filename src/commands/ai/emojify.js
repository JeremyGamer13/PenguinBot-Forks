const makePng = require('../../util/make-png');
const ChatGPT = require("../../util/chatgpt");
const ChatGPTClient = new ChatGPT();

class Command {
    constructor() {
        this.name = "emojify";
        this.description = "Explain in fortnite terms";
        this.attributes = {
            permission: 0,
            adminInclusive: ['860531746294726736', '790782926785609728', '567307285324496897'],
        };
    }

    async invoke(message, args, util) {
        const attachment = message.attachments.first();
        if (!attachment) return message.reply("😶");
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
        const chatId = `aiemojifyimage-${Math.random()}`;
        ChatGPTClient.createChat(chatId);
        ChatGPTClient.informChat(chatId,
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
            response = await ChatGPTClient.advancedPrompt(chatId, "Please describe the image using emojis.", imageBuffer);
        } catch (err) {
            message.reply("**Took too long to prompt.**");
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