class Command {
    constructor() {
        this.name = "whatisyourfavoriteanimal";
        this.description = "Seriously though, it's ridiculously simple and easily predictable. 🔥";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    invoke(message) {
        return message.reply(`rabbit`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;