const AIChatHelper = require("../../util/ai-chat-helper");
const tryCatch = require("../../util/try-catch");

class Command {
    constructor() {
        this.name = "prompt";
        this.description = "tyea";
        this.attributes = {
            permission: 4,
            unlisted: true,
            adminInclusive: ['860531746294726736', '790782926785609728', '567307285324496897', '694587798598058004', '715193626430406770'],
        };
    }

    async getResponse(chatId, message) {
        try {
            return await AIChatHelper.client.chatPrompt(chatId, message);
        } catch (err) {
            return null;
        }
    }
    async invoke(message, args, util) {
        // start asking chattus geepitus
        const role = args.shift();
        if (!['user', 'assistant', 'system'].includes(role)) throw new Error("Role must be 'user' 'assistant' 'system'");
        const chatId = args.shift();
        if (!chatId) throw new Error("Specify chat bro");
        if (!AIChatHelper.client.chatExists(chatId)) throw new Error("Bradar what is this Thats not a real chat");

        if (role !== "user") {
            AIChatHelper.client.informChatWithRole(chatId, role, args.join(" ") || "Keep going");
            console.log(AIChatHelper.client.exportChat(chatId));
            return message.reply("Done, ask with 'user' role to generate");
        }

        // get the response
        const response = await this.getResponse(chatId, args.join(" ") || "Hi");
        if (!response) return message.reply("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        message.reply({
            content: response.trim().substring(0, 2000),
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