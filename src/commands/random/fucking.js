const discord = require("discord.js");

class Command {
    constructor(client) {
        this.name = "fucking";
        this.description = "evil evil evil sahur";
        this.attributes = {
            permission: 0,
            unlisted: true,
        };
    }

    invoke(message, args) {
        const wording = args.join(" ");
        if (wording !== "kill EVERYONE here") return;
        message.reply("Ok");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;