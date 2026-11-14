const discord = require("discord.js");

const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "die";
        this.description = "this is so evil";
        this.attributes = {
            permission: 0,
            unlisted: true,
        };
    }

    invoke(message, args, util) {
        message.react("😨");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;