const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "emily";
        this.description = "emily";
        this.attributes = {
            permission: 0,
            unlisted: true,
        };
    }

    invoke(message, args, util) {
        message.reply("emily command emily command");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;