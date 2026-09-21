class Command {
    constructor(client) {
        this.name = "gen1x";
        this.description = "The the c";
        this.attributes = {
            permission: 0,
            unlisted: true,
        };

        this.alias = ["g1nx"];
    }

    invoke(message) {
        message.reply("Bro thought");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;