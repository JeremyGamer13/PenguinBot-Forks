const Ollama = require("../../util/ollama");
const OllamaClient = new Ollama();

const SchemaSBPicGeneration = require('../../resources/schemas/sbpic-gen.json')

class Command {
    constructor() {
        this.name = "aitest";
        this.description = "test";
        this.attributes = {
            permission: 4,
            unlisted: true,
        };
    }

    async invoke(message, args, util) {
        // start asking chattus geepitus
        const chatId = `aitest-${Math.random()}`;
        OllamaClient.createChat(chatId);
        OllamaClient.informChat(chatId, `You are a bot`
            + `\n` + `You can draw pictures using the JSON schema`);

        // test schema
        const schema = SchemaSBPicGeneration;

        // get the response & reset the chat
        let response = "";
        try {
            const output = await OllamaClient.chatStructuredPrompt(chatId, schema, args.join(" "));
            response = output.content;
        } catch (err) {
            return message.reply("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        } finally {
            console.log(OllamaClient.getChat(chatId));
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