const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "finnie";
        this.description = "y";
        this.attributes = {
            permission: 0,
            unlisted: true,
        };
    }

    invoke(message, args, util) {
        message.reply("this is the finnie command finniefinnie finnfinnfinnAAAAHHHH!! AAAAHHHH!! AAAAHHHH!! AAAAHHHH!! AAAAHHHH!! AAAAHHHH!! ;");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;