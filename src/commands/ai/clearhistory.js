const discord = require("discord.js");

const PenguinAI = require("../../util/penguinai.js");

const configuration = require("../../config.js");

class Command {
    constructor() {
        this.name = "clearhistory";
        this.description = "Clears the chat history for all PenguinAI channels.";
        this.attributes = {
            permission: 2,
        };

        this.alias = ["clrhistory"];
    }
    async invoke(message, args, util) {
        PenguinAI.history.clear();
        message.react("✅");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;