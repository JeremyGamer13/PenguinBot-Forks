const OllamaModels = require("../../util/ollama-models");
const tryCatch = require("../../util/try-catch");

const AISharedChat = require("../../util/ai-chat");

class Command {
    constructor() {
        this.name = "aichat";
        this.description = "tyea";
        this.attributes = {
            permission: 4,
            unlisted: true,
            jgAiChatCommand: true,
            jgOllamaClientsInvolved: ["mutatableChatbot"],
        };
    }

    async invoke(message, args, util) {
        const action = args.shift();
        if (!['create', 'delete'].includes(action)) throw new Error("action must be 'create' 'delete'");
        const chatId = args.shift();
        if (!chatId) throw new Error("Specify chat bro");

        if (action === "create" && AISharedChat.chats[chatId]) throw new Error("Bradar what is this Thats  a real chat");
        if (action === "delete" && !AISharedChat.chats[chatId]) throw new Error("Bradar what is this Thats not a real chat");
        if (action === "create") {
            if (chatId.match(/[^a-z0-9\_\-]/g)) throw new Error("Invalid chat ID");
            AISharedChat.createChat(chatId);
        } else {
            delete AISharedChat.chats[chatId];
        }

        message.reply({
            content: `${action}d chat with ID \`${chatId}\`${action === "create" ? " (Note that chats are deleted on restart lol)" : ""}`,
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