class Command {
    constructor() {
        this.name = "getrandomnumber";
        this.description = "😂 Please, please, *please* don’t be such a drama queen.";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    invoke(message) {
        return message.reply(`${Math.random()}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;