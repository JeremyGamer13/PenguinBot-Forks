const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "addme";
        this.description = "Okay – because why would we *not* want to add another channel? It’s just… logical.";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    invoke(message, args, util) {
        return message.reply(`Sent!`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;