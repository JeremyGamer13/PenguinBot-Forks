class Command {
    constructor() {
        this.name = "complimenttheserver";
        this.description = "To provide a hilariously underwhelming assessment of a server's status.";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    invoke(message) {
        message.reply(`Your server is… adequately functional.`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;