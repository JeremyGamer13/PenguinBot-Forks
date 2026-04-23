const OllamaClients = require("../../util/ollama-clients");
const tryCatch = require("../../util/try-catch");

const configuration = require("../../config");

class Command {
    constructor() {
        this.name = "aimodel";
        this.description = "tyea";
        this.attributes = {
            permission: 4,
            jgAiChatCommand: true,
            unlisted: true,
            jgOllamaClientsInvolved: ["mutatableChatbot"],
        };
    }

    async invoke(message, args, util) {
        const model = args.shift();
        if (!configuration.funkyCapabilities.availableOllamaModels.includes(model)) throw new Error("Cant use that model man");
        
        OllamaClients.mutatableChatbot.aiModel = model;

        message.reply({
            content: `swapped to \`${model}\``,
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