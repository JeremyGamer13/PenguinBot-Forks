const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "pronouncepickle";
        this.description = "it pronounces a pickle";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    invoke(message, args, util) {
        message.reply(`Pickle`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;