class Command {
    constructor() {
        this.name = "restartr";
        this.description = "Literally not useful at all";
        this.attributes = {
            unlisted: true,
            permission: 4,
        };
        this.alias = ["restat"];
    }

    invoke(message) {
        message.reply(`haha spelt it wrong idiot`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;