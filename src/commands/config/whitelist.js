const Database = require('sync-json-database');
const WhitelistChannels = new Database('./databases/whitelist-channels.json');
const SpeakingChannels = new Database('./databases/speaking-channels.json');

const PenguinAI = require('../../util/penguinai.js');

class Command {
    constructor() {
        this.name = "whitelist";
        this.description = "Enable or disable PenguinAI chatting in a channel.";
        this.descriptionLong = "Enable or disable PenguinAI listening & chatting in a channel."
            + "\n" + "This enables PenguinAI commands that prompt the AI, as well as ping/mention call & response behavior."
            + "\n" + "PenguinAI doesn't listen in channels he doesn't know about."
            + "\n" + "Disabling a channel will also remove speakhere configuration.";
        this.example = [
            { text: "{{prefix}}whitelist" },
            { text: "{{prefix}}whitelist disable" },
        ]
        this.attributes = {
            permission: 2,
        };
    }

    invoke(message, args) {
        const channelId = message.channel.id;
        const enableListening = args[0] !== 'disable';
        WhitelistChannels.set(channelId, enableListening);

        // we cant be speaking if we arent whitelisted
        if (!enableListening)
            SpeakingChannels.set(channelId, false);

        if (!PenguinAI.canListenIn(channelId))
            PenguinAI.history.delete(channelId);

        message.reply(`Got it I ${enableListening ? "will START listening here" : "will NOT listen here anymore"}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
