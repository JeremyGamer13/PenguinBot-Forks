const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "getrandomnumber";
        this.description = "😂 Please, please, *please* don’t be such a drama queen.";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    invoke(message, args, util) {
        return message.reply(`${Math.random()}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;