class Command {
    constructor() {
        this.name = "pronouncepickle";
        this.description = "it pronounces a pickle";
        this.attributes = {
            unlisted: true,
            permission: 0,
        };
    }

    invoke(message) {
        message.reply(`pickle`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;