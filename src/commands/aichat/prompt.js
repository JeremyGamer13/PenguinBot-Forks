const OllamaModels = require("../../util/ollama-models");
const tryCatch = require("../../util/try-catch");

const AISharedChat = require("../../util/ai-chat");

class Command {
    constructor() {
        this.name = "prompt";
        this.description = "tyea";
        this.attributes = {
            permission: 4,
            unlisted: true,
            jgAiChatCommand: true,
            jgOllamaClientsInvolved: ["mutatableChatbot"],
        };
    }

    async invoke(message, args, util) {
        // start asking chattus geepitus
        const role = args.shift();
        if (!['user', 'assistant', 'system'].includes(role)) throw new Error("Role must be 'user' 'assistant' 'system'");
        const chatId = args.shift();
        if (!chatId) throw new Error("Specify chat bro");
        const ollamaChat = AISharedChat.chats[chatId];
        if (!ollamaChat) throw new Error("Bradar what is this Thats not a real chat");

        console.log(ollamaChat.history);
        if (role !== "user") {
            ollamaChat.history.push({
                role,
                content: args.join(" ") || "Keep going"
            });
            return message.reply("Done, ask with 'user' role to generate");
        }

        // get the response
        try {
            const response = await ollamaChat.chat({
                ...OllamaModels.mutatableChatbot,
                messages: [{
                    role,
                    content: args.join(" ") || "Hi",
                }],
            });
            const messageText = response.message.content;
            message.reply({
                content: messageText.trim().substring(0, 2000),
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        } catch (err) {
            console.warn(err);
            return message.reply("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;