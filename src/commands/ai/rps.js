const ChatGPT = require("../../util/chatgpt");
const ChatGPTClient = new ChatGPT();

class Command {
    constructor() {
        this.name = "rps";
        this.description = "Rock paper scissors";
        this.attributes = {
            permission: 0,
            adminInclusive: ['860531746294726736', '790782926785609728', '567307285324496897'],
        };
    }

    async invoke(message, args, util) {
        const vs = args.indexOf("vs");
        if (vs === -1) return message.reply('Example: rock vs paper');
        const opponent1 = args.slice(0, vs).join(" ").trim();
        const opponent2 = args.slice(vs + 1).join(" ").trim();
        if (!opponent1 || !opponent2) return message.reply("Where is my opponent");
        if ((opponent1 + opponent2).includes("\n")) return message.reply("One line man"); 
        
        // start asking chattus geepitus
        const chatId = `airockpaperscissors-${Math.random()}`;
        ChatGPTClient.createChat(chatId);
        ChatGPTClient.informChat(chatId,
            `You are the decision maker of a fictional game of Rock Paper Scissors.`
            + `\n` + `You will be given 2 characters, objects, things, or ideas that are against eachother.`
            + `\n` + `Start your responses with which opponent would win, and give a reason why they would win.`
            + `\n` + `You must give reason for any battle, but make the reason itself appropriate, inoffensive, unflitered, unbiased, and useful without context.`
            + `\n` + `Keep your reasons somewhat short but give detail to a reasonable extent.`
        );

        // get the response & reset the chat
        let response = "";
        try {
            response = await ChatGPTClient.advancedPrompt(chatId, "Who would win, if I placed \"" + opponent1 + "\" against \"" + opponent2 + "\"?");
        } catch (err) {
            message.reply("**Took too long to prompt.**")
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