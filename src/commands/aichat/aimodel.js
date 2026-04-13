const OllamaClients = require("../../util/ollama-clients");
const tryCatch = require("../../util/try-catch");

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
        if (!OllamaClients.AVAILABLE_MODELS.includes(model)) throw new Error("Cant use that model man");
        
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