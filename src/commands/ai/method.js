const discord = require("discord.js");

class Command {
    constructor(client) {
        this.name = "method";
        this.description = "Get the speech method of the bot (LLM or Markov).";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };

        /** @type {discord.Client} */
        this.client = client;
    }

    async invoke(message, _, util) {
        message.reply({
            content: util.state.enabledMarkov ? `Currently using **Markov chain**`
                : `Currently using **Ollama LLM**`,
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;