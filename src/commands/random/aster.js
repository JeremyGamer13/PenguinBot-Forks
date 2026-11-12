const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "aster";
        this.description = "Hey its me its not verity";
        this.attributes = {
            permission: 0,
            unlisted: true,
        };
    }

    invoke(message, args, util) {
        message.reply("aster");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;