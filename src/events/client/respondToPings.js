const discord = require("discord.js");
const CommandUtility = require("../../util/utility.js");

const configuration = require("../../config.js");
const env = require("../../util/env-util.js");

const Database = require('sync-json-database');
const WhitelistChannels = new Database('./databases/whitelist-channels.json');

class BotEvent {
    constructor(client) {
        this.listener = "messageCreate";
        this.once = false;

        this.client = client;

        // keep a running history of all the messages so far
        this.history = new Map();
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
        const isInPersonalMode = state.isInPersonalMode;

        const isTestingInPublic = isInTestMode && !(env.getBool("CHECK_FOR_DEFAULT_TEST_SERVERS") && message.guildId === "746156168560508950")

        // ignore #spam
        if (
            message.channel.id === configuration.channels.spam
            || (message.channel.parent && message.channel.parent.id === configuration.channels.spam)
        ) return;
        // ignore disabled channels
        const isDisabled = WhitelistChannels.get(message.channel.id) === false;
        if (isDisabled) return;

        // ignore commands
        if (message.content.startsWith(prefix)) return;
    }
}

module.exports = BotEvent;