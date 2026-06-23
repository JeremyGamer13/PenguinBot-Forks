const discord = require("discord.js");

class Command {
    constructor(client) {
        this.name = "Kill";
        this.description = "this is so evil";
        this.attributes = {
            permission: 0,
            unlisted: true,
        };
    }

    invoke(message, args) {
        const wording = args.join(" ");
        if (wording !== "7 billion people" && wording !== "7 Billion People") return;

        const reactions = [
            "i-.. what...?",
            "dont joke abt stuff like this.",
            "?? is this real..??",
            "*i- i cant deal with this right now... i'm sorry...*",
        ];
        message.reply(reactions[Math.round(Math.random() * (reactions.length - 1))]);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;