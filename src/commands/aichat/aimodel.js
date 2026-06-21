const tryCatch = require("../../util/try-catch");
const configuration = require("../../config");

const OllamaModels = require("../../util/ollama-models");
const OllamaTools = require("../../util/ollama-tools");

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
        const setThinking = String(args.shift());
        const setToolset = args.shift();
        
        // set properties
        OllamaModels.mutatableChatbot.model = model;

        switch (setThinking) {
            case "true":
                OllamaModels.mutatableChatbot.think = true;
                break;
            case "false":
                OllamaModels.mutatableChatbot.think = false;
                break;
        }

        switch (setToolset) {
            case "none":
                OllamaModels.mutatableChatbot.tools = null;
                break;
            case null:
            case undefined:
                break;
            default:
                OllamaModels.mutatableChatbot.tools = OllamaTools.getList(setToolset);
                break;
        }

        // list new properties
        message.reply({
            content: `for next prompt i will use: \`${OllamaModels.mutatableChatbot.model}\``
                + " " + `with \`think\` = \`${OllamaModels.mutatableChatbot.think}\``
                + " " + `using toolset \`${setToolset || "*unchanged*"}\``,
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