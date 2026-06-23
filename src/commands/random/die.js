const discord = require("discord.js");

class Command {
    constructor(client) {
        this.name = "die";
        this.description = "this is so evil";
        this.attributes = {
            permission: 0,
            unlisted: true,
        };
    }

    invoke(message) {
        message.react("😨");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;