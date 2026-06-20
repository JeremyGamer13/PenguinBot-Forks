const OllamaModels = require("../../util/ollama-models");
const tryCatch = require("../../util/try-catch");

const configuration = require("../../config");

class Command {
    constructor() {
        this.name = "aimodel";
        this.description = "tyea";
        this.attributes = {
            permission: 4,
            unlisted: true,
            jgAiChatCommand: true,
            jgOllamaClientsInvolved: ["mutatableChatbot"],
        };
    }

    async invoke(message, args, util) {
        const model = args.shift();
        if (!configuration.funkyCapabilities.availableOllamaModels.includes(model)) throw new Error("Cant use that model man");
        
        OllamaModels.mutatableChatbot.model = model;
        message.reply({
            content: `swapped to \`${model}\` for next prompt`,
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