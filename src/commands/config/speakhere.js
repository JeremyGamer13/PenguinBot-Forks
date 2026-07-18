const Database = require('sync-json-database');
const WhitelistChannels = new Database('./databases/whitelist-channels.json');

const OptionType = require('../util/optiontype');

class Command {
    constructor() {
        this.name = "speakhere";
        this.description = "Enable or disable PenguinAI chatting in a channel.";
        this.descriptionLong = "Enable or disable PenguinAI chatting in a channel."
            + "\n" + "This also enables PenguinAI commands that prompt the AI."
            + "\n" + "By default, PenguinAI doesn't speak in channels he doesn't know about.";
        this.example = [
            { text: "{{prefix}}speakhere" },
            { text: "{{prefix}}speakhere disable" },
        ]
        this.attributes = {
            permission: 2,
        };
    }

    invoke(message, args) {
        const enableSpeaking = args[0] !== 'disable';
        WhitelistChannels.set(message.channel.id, enableSpeaking);
        message.reply(`Got it. I ${enableSpeaking ? "will start listening here" : "will not speak here anymore"}.`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
