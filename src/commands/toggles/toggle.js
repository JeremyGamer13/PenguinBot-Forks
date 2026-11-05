const configuration = require("../../config");

const BotState = require("../../util/bot-state.js");

const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "toggle";
        this.description = "Enable or disable the AI.";
        this.attributes = {
            unlisted: true,
            permission: 3,
        };
    }

    invoke(message, args, util) {
        if (!configuration.permissions.toggle.includes(message.author.id))
            return this.reject(message, "You don't have the permission to do this.", util);

        if (!args[0]) {
            BotState.state.enabledAi = !BotState.state.enabledAi;
            message.reply(`${BotState.state.enabledAi ? "hello" : ":("}`);
            return;
        }
        BotState.state.enabledAi = String(args[0]).toLowerCase().trim() !== 'true';
        message.reply(`${BotState.state.enabledAi ? "hello" : ":("}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;