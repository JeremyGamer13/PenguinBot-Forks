const discord = require("discord.js");

const BotState = require("../../util/bot-state.js");

const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "method";
        this.description = "Get the speech method of the bot (LLM or Markov).";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
    }

    async invoke(message) {
        message.reply({
            content: BotState.state.enabledMarkov ? `Currently using **Markov chain**`
                : `Currently using **Ollama LLM**`,
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;