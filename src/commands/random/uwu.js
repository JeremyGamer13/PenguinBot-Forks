class Command {
    constructor() {
        this.name = "uwu";
        this.description = "Command";
        this.attributes = {
            unlisted: true,
            permission: 0,
        };
    }

    invoke(message) {
        message.reply(`I'm not processing any of that request brochacho ✌`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;