class Command {
    constructor(client) {
        this.name = "whatisyourusername";
        this.description = "It’s just… incredibly obvious, isn't it? 🤖";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
        
        this.client = client;
    }

    invoke(message) {
        message.reply(`I am ${this.client.user.username}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;