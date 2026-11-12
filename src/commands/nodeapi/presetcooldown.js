const BotState = require("../../util/bot-state.js");

const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "presetcooldown";
        this.description = "the overlay audio shits Cooldown.";
        this.attributes = {
            unlisted: true,
            permission: 4,
            numberConversion: true,
        };
    }

    invoke(message, args, util) {
        if (typeof args[0] !== "number") {
            message.reply(`nodeApiPresetCooldown = ${BotState.state.nodeApiPresetCooldown}`);
            return;
        }
        BotState.state.nodeApiPresetCooldown = Number(args[0]);
        message.reply(`nodeApiPresetCooldown = ${BotState.state.nodeApiPresetCooldown}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;