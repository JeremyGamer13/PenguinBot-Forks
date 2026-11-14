const BotState = require("../../util/bot-state.js");

const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "togglea";
        this.description = "Enable or disable the audio shits.";
        this.attributes = {
            unlisted: true,
            permission: 4,
        };
    }

    invoke(message, args, util) {
        if (!args[0]) {
            BotState.state.nodeApiAudios = !BotState.state.nodeApiAudios;
            message.reply(`nodeApiAudios = ${BotState.state.nodeApiAudios}`);
            return;
        }
        BotState.state.nodeApiAudios = String(args[0]).toLowerCase().trim() !== 'true';
        message.reply(`nodeApiAudios = ${BotState.state.nodeApiAudios}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;