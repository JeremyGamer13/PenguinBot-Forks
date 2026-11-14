const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "whatisyourusername";
        this.description = "It’s just… incredibly obvious, isn't it? 🤖";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    invoke(message, args, util) {
        message.reply(`I am ${this.client.user.username}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;