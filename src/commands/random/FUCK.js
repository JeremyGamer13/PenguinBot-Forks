const discord = require("discord.js");

const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "FUCK";
        this.description = "aah!";
        this.attributes = {
            permission: 0,
            unlisted: true,
        };
    }

    invoke(message, args, util) {
        if (args.length !== 1) return;

        const word = args[0].toLowerCase();
        switch (word) {
            case "you":
            case "yourself":
            case "off":
            case "face":
            case "head":
            case "that":
            case "no":
            case "nah":
                return message.react("😢");
            case "on":
                return message.react("🤨");
            case "about":
            case "around":
            case "everything":
            case "all":
            case "sake":
            case "knows":
            case "sake":
                return message.react("😒");
            case "yes":
            case "yeah":
                return message.react("😋");
            default:
                return;
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;