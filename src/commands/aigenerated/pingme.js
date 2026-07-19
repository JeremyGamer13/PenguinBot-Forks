class Command {
    constructor(client) {
        this.name = "pingme";
        this.description = "It’s demonstrating a desire for responsiveness... even when it’s demonstrably pointless.";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
        
        this.client = client;
    }

    invoke(message) {
        message.reply(`<@${this.client.user.id}>`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;