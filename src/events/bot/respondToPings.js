const discord = require("discord.js");

const configuration = require("../../config.js");

const Database = require('sync-json-database');
const SpeakingChannels = new Database('./databases/speaking-channels.json');
const WhitelistChannels = new Database('./databases/whitelist-channels.json');

const env = require("../../util/env-util.js");
const BotState = require("../../util/bot-state.js");
const PenguinAI = require("../../util/penguinai.js");
const BotEventEmitter = require("../../util/bot-event-emitter.js");

const BaseBotEvent = require("../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "userSentMessage";
        this.once = false;

        this.handler = BotEventEmitter;
    }

    /**
     * @param {discord.Message} message 
     * @returns 
     */
    addMessageToHistory(message) {
        // see if this is automodded/ai controlling
        if (!PenguinAI.canListenTo(message.cleanContent))
            return;

        const channelId = message.channel.id;
        const history = PenguinAI.history.get(channelId) || [];

        // DISCLOSURE: ai cleeeaned
        // 1. Add the new message to the front
        history.unshift(message.cleanContent);

        // 2. Trim the array to the maximum allowed length
        if (history.length > PenguinAI.HISTORY_LENGTH) {
            history.length = PenguinAI.HISTORY_LENGTH;
        }

        return PenguinAI.history.set(channelId, history);
    }

    /**
     * Runs when the event is invoked
     * @param {import("discord.js").Message} message 
     * @returns {Promise<any>}
     */
    async invoke(message) {
        // if ai disabled then dont
        if (!BotState.state.enabledAi) return;
        // ignore disabled channels
        const channelId = message.channel.id;
        const parentId = !message.channel.parent ? channelId
            : (message.channel.parent.type === "GUILD_TEXT" || message.channel.parent.type === "GUILD_FORUM" ? message.channel.parentId : channelId);
        const isDisabled = WhitelistChannels.get(channelId) === false || WhitelistChannels.get(parentId) === false;
        if (isDisabled) return;
        if (!PenguinAI.canListenIn(channelId) || !PenguinAI.canListenIn(parentId)) return;

        // see if we need to talk
        // TODO: See if interactions are disabled on this user
        const wasPrompted = PenguinAI.canSpeakIn(channelId)
            || message.mentions.members.find((member) => member.id === this.client.user.id);
        const history = PenguinAI.history.get(channelId) || [];
        try {
            if (!wasPrompted) return;
            try { await message.channel.sendTyping(); } catch { } // genuinely dont care if this fails

            // TODO: We REALLY DESPERATELY need to make PenguinAI use chats and not oneshot generating like this
            const response = await PenguinAI.generate({
                prompt: BotState.state.enabledMarkov || history.length <= 0 ? message.cleanContent : ""
                    + "Some other people were talking about like,"
                    + "\n" + history.toReversed().join("\n")
                    + "\n"
                    + "\n" + `But what I ACTUALLY wanna say to you, is ${message.cleanContent}`,
            });
            await message.reply({
                content: response,
                flags: discord.MessageFlags.FLAGS.SUPPRESS_EMBEDS,
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        } finally {
            this.addMessageToHistory(message);
        }
    }
}

module.exports = BotEvent;