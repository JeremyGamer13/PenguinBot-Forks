const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "whatisyourfavoriteanimal";
        this.description = "Seriously though, it's ridiculously simple and easily predictable. 🔥";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    invoke(message, args, util) {
        return message.reply(`rabbit`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;