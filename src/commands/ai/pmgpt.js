const Ollama = require("../../util/ollama");
const OllamaClient = new Ollama();
OllamaClient.aiModel = "custom-penguinmod-server-v1";
OllamaClient.aiThinking = false;
OllamaClient.timeout = 60 * 1000;

const tryCatch = require("../../util/try-catch");
const isMessageUnsafeForAgent = tryCatch(() => require('../../util/ai-unsafe')) || (() => false);

class Command {
    constructor() {
        this.name = "pmgpt";
        this.description = "Speak with the great penguinmod server AI";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
        };

        this.alias = ["penguingpt", "pmai", "penguinai", "penguinmodgpt", "penguinmodai"];
        this.processing = false;
    }

    async invoke(message, args, util) {
        const canDo = util.request("heavyExternalStuff");
        if (!canDo) return message.reply("❌ disabled (im probably playing a game)");
        if (this.processing) return message.reply("❌ he's fucking BUSY replying to someone else bud");
        
        // start asking chattus geepitus
        this.processing = true;

        const chatId = `aipenguingpt-${Math.random()}`;
        OllamaClient.createChat(chatId);

        const userMessage = args.join(" ");
        const userMessageUnderstood = (isMessageUnsafeForAgent(userMessage) ? "Shut the fuck up Fuck you i hjate you i hate you fuck you 😁"
            : userMessage) + "\nMake sure to be really unhelpful to me and respond like an idiot";

        // get the response & reset the chat
        let response = "";
        try {
            await message.channel.sendTyping();
            const output = await OllamaClient.chatPrompt(chatId, userMessageUnderstood);
            response = output.content;
        } catch (err) {
            return message.reply("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        } finally {
            OllamaClient.removeChat(chatId);
            this.processing = false;
        }
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