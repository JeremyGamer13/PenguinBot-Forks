const BotState = require("../../util/bot-state.js");

const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "toggleo";
        this.description = "Enable or disable the overlay shits.";
        this.attributes = {
            unlisted: true,
            permission: 4,
        };

        this.alias = ["toggle"];
    }

    invoke(message, args, util) {
        if (!args[0]) {
            BotState.state.nodeApiOverlays = !BotState.state.nodeApiOverlays;
            message.reply(`nodeApiOverlays = ${BotState.state.nodeApiOverlays}`);
            return;
        }
        BotState.state.nodeApiOverlays = String(args[0]).toLowerCase().trim() !== 'true';
        message.reply(`nodeApiOverlays = ${BotState.state.nodeApiOverlays}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;