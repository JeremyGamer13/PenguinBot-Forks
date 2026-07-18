const Database = require('sync-json-database');
const WhitelistChannels = new Database('./databases/whitelist-channels.json');
const SpeakingChannels = new Database('./databases/speaking-channels.json');

const PenguinAI = require('../../util/penguinai.js');

class Command {
    constructor() {
        this.name = "speakhere";
        this.description = "Enable or disable PenguinAI chatting automatically in a channel.";
        this.descriptionLong = "Enable or disable PenguinAI listening & chatting automatically in a channel."
            + "\n" + "This also whitelists the channel for other AI behavior.";
        this.example = [
            { text: "{{prefix}}speakhere" },
            { text: "{{prefix}}speakhere disable" },
        ]
        this.attributes = {
            permission: 2,
        };
    }

    invoke(message, args) {
        const channelId = message.channel.id;
        const enableSpeaking = args[0] !== 'disable';
        SpeakingChannels.set(channelId, enableSpeaking);

        // whitelist this channel if we want to speak here
        if (enableSpeaking)
            WhitelistChannels.set(channelId, true);

        if (!PenguinAI.canListenIn(channelId))
            PenguinAI.history.delete(channelId);

        message.reply(`Got it I ${enableSpeaking ? "will START speaking here" : "will NOT talk here anymore :("}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
