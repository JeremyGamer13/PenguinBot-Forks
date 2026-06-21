const Ollama = require("ollama-chatting");
const OllamaModels = require("../../util/ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

class Command {
    constructor() {
        this.name = "commandidea";
        this.description = "I Need an idea for a command";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
            jgollamaConfigsInvolved: ["lightText"],
        };
    }

    async invoke(message, args, util) {
        if (args.length > 0) return message.reply("Shut up");
        
        // start asking chattus geepitus get the response
        try {
            const output = await OllamaChat.generate({
                ...OllamaModels.lightText,
                prompt: "Give me a really stupid discord bot command",
                system: `You are a Discord bot named Jeremy Stream Bot.`
                    + `\n` + `Think of a really stupid discord bot command using general online internet humor (not memes).`
                    + `\n` + `You can be sarcastic, satirical and use irony. Avoid internet memes.`
                    + `\n` + `Keep your responses appropriate and inoffensive.`
                    + `\n` + `Keep your reasons in a short sentence. Never refer to yourself specifically to any extent.`
            });
            message.reply({
                content: output.response.trim(),
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        } catch (err) {
            return message.reply("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;