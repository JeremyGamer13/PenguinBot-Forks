const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "gen1x";
        this.description = "The the c";
        this.attributes = {
            permission: 0,
            unlisted: true,
        };

        this.alias = ["g1nx"];
    }

    invoke(message, args, util) {
        message.reply("Bro thought");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;