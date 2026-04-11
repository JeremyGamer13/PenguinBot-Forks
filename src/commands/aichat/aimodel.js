const AIChatHelper = require("../../util/ai-chat-helper");
const tryCatch = require("../../util/try-catch");

const availableModels = [
    "gemma4:e4b",
    "gemma4:e2b",
    "custom-penguinmod-server-v1",
    "gemma3:270m",
    "qwen3-vl:2b",
    "qwen3-vl:8b",
    "qwen3-vl:4b",
    "gemma3:12b",
    "qwen3:8b",
    "deepseek-r1:8b",
    "qwen3:4b",
    "gemma3:1b",
    "gemma3:4b",
];

class Command {
    constructor() {
        this.name = "aimodel";
        this.description = "tyea";
        this.attributes = {
            permission: 4,
            unlisted: true,
            adminInclusive: ['860531746294726736', '790782926785609728', '567307285324496897', '694587798598058004', '715193626430406770'],
        };
    }

    async invoke(message, args, util) {
        const model = args.shift();
        if (!availableModels.includes(model)) throw new Error("Cant use that model man");
        
        AIChatHelper.client.aiModel = model;

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