class Command {
    constructor(client) {
        this.name = "!gj";
        this.description = "guys seeyes";
        this.attributes = {
            permission: 0,
            unlisted: true,
        };
    }

    invoke(message) {
        message.reply("weew");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;