class Command {
    constructor(client) {
        this.name = "hi";
        this.description = "hi";
        this.attributes = {
            permission: 0,
            unlisted: true,
        };
    }

    invoke(message, args) {
        message.reply("Hi");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;