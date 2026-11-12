const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "pingme";
        this.description = "It’s demonstrating a desire for responsiveness... even when it’s demonstrably pointless.";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    invoke(message, args, util) {
        message.reply(`<@${this.client.user.id}>`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;