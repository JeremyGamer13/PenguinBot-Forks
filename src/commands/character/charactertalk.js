const discord = require("discord.js");

const Canvas = require("canvas");

const CharacterManager = require("../../util/character-manager.js");

class Command {
    constructor(client) {
        this.name = "charactertalk";
        this.description = "In development";
        this.attributes = {
            helpIcon: "😃",
            permission: 0,
        };

        this.client = client;
        this.alias = ["talkcharacter", "chartalk", "talkchar"];
    }

    invoke(message, args, util) {
        throw new Error("Not implemented");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;