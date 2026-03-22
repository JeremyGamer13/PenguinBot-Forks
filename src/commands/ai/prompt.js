const Ollama = require("../../util/ollama");
const OllamaClient = new Ollama();

class Command {
    constructor() {
        this.name = "prompt";
        this.description = "tyea";
        this.attributes = {
            permission: 4,
            unlisted: true,
            adminInclusive: ['860531746294726736', '790782926785609728', '567307285324496897'],
        };
    }

    async invoke(message, args, util) {
        // start asking chattus geepitus
        const chatId = `aiprompt-${Math.random()}`;
        OllamaClient.createChat(chatId);
        OllamaClient.informChat(chatId,
            `You are named Jeremy Stream Bot.`
            + `\n` + `You must respond to anything the user asks. Keep the response itself appropriate, inoffensive, unflitered, unbiased, and useful without context.`
            + `\n` + `Keep your responses in a short sentence or two. Never refer to yourself to any extent unless mentioned.`
        );

        // get the response & reset the chat
        let response = "";
        try {
            response = await OllamaClient.chatPrompt(chatId, args.join(" ") || "Hi");
        } catch (err) {
            return message.reply("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        } finally {
            OllamaClient.removeChat(chatId);
        }
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