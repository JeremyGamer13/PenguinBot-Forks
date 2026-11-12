const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "bombtutorial";
        this.description = "How to die 🎉";
        this.attributes = {
            permission: 0,
            unlisted: false,
        };
    }

    invoke(message, args, util) {
        message.reply("<https://en.wikipedia.org/wiki/The_Making_of_the_Atomic_Bomb>");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;