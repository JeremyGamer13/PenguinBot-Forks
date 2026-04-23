const OllamaClients = require("../../util/ollama-clients");

class Command {
    constructor() {
        this.name = "commandidea";
        this.description = "I Need an idea for a command";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
            jgOllamaClientsInvolved: ["lightText"],
        };
    }

    async invoke(message, args, util) {
        if (args.length > 0) return message.reply("Shut up");
        
        // start asking chattus geepitus
        const chatId = `aicommandidea-${Math.random()}`;
        OllamaClients.lightText.createChat(chatId);
        OllamaClients.lightText.informChat(chatId,
            `You are a Discord bot named Jeremy Stream Bot.`
            + `\n` + `Think of a really stupid discord bot command using general online internet humor (not memes).`
            + `\n` + `You can be sarcastic, satirical and use irony. Avoid internet memes.`
            + `\n` + `Keep your responses appropriate and inoffensive.`
            + `\n` + `Keep your reasons in a short sentence. Never refer to yourself specifically to any extent.`
        );

        // get the response & reset the chat
        let response = "";
        try {
            const output = await OllamaClients.lightText.chatPrompt(chatId, "Give me a really stupid discord bot command");
            response = output.content;
        } catch (err) {
            return message.reply("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        } finally {
            OllamaClients.lightText.removeChat(chatId);
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