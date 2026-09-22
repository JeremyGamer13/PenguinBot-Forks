class Command {
    constructor(client) {
        this.name = "emily";
        this.description = "emily";
        this.attributes = {
            permission: 0,
            unlisted: true,
        };
    }

    invoke(message) {
        message.reply("emily command emily command");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;