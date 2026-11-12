const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "!gj";
        this.description = "guys seeyes";
        this.attributes = {
            permission: 0,
            unlisted: true,
        };
    }

    invoke(message, args, util) {
        message.reply("weew");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;