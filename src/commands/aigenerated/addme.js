class Command {
    constructor(client) {
        this.name = "addme";
        this.description = "Okay – because why would we *not* want to add another channel? It’s just… logical.";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };

        this.client = client;
    }

    invoke(message) {
        return message.reply(`Sent!`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;