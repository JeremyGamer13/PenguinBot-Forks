const discord = require("discord.js");
const CommandUtility = require("../../util/utility.js");

const configuration = require("../../config.js");
const env = require("../../util/env-util.js");

const Database = require('sync-json-database');
const SpeakingChannels = new Database('./databases/speaking-channels.json');
const WhitelistChannels = new Database('./databases/whitelist-channels.json');

const PenguinAI = require("../../util/penguinai.js");

class BotEvent {
    constructor(client) {
        this.listener = "messageCreate";
        this.once = false;

        this.client = client;
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
     * @param {discord.Client} client 
     * @param {*} state 
     * @param {discord.Message} message 
     * @returns 
     */
    async invoke(client, state, message) {
        // if ai disabled then dont
        if (!state.enabledAi) return;
        // ignore bots
        if (!message.author) return;
        if (message.author.bot) return;
        if (message.author.system) return;
        if (message.system) return;

        const prefix = state.prefix;
        const isInTestMode = state.isInTestMode;
        const isTestingInPublic = isInTestMode && !(env.getBool("CHECK_FOR_DEFAULT_TEST_SERVERS") && message.guildId === "746156168560508950")

        // ignore commands
        if (message.content.startsWith(prefix)) return;

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
            || message.mentions.members.find((member) => member.id === client.user.id);
        const history = PenguinAI.history.get(channelId) || [];
        try {
            if (!wasPrompted) return;
            try { await message.channel.sendTyping(); } catch { } // genuinely dont care if this fails

            const response = await PenguinAI.generate({
                // TODO: If we know we're talking to the markov model, dont bother giving history
                prompt: history.length <= 0 ? message.cleanContent : ""
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