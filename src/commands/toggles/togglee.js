const BotState = require("../../util/bot-state.js");

const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "togglee";
        this.description = "Enable or disable the External shits.";
        this.attributes = {
            unlisted: true,
            permission: 4,
        };
    }

    invoke(message, args, util) {
        if (!args[0]) {
            BotState.state.heavyExternalStuff = !BotState.state.heavyExternalStuff;
            message.reply(`heavyExternalStuff = ${BotState.state.heavyExternalStuff}`);
            return;
        }
        BotState.state.heavyExternalStuff = String(args[0]).toLowerCase().trim() !== 'true';
        message.reply(`heavyExternalStuff = ${BotState.state.heavyExternalStuff}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;