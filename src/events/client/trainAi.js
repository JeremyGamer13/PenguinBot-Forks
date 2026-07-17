const discord = require("discord.js");
const CommandUtility = require("../../util/utility.js");

const configuration = require("../../config.js");
const env = require("../../util/env-util.js");

const Database = require('sync-json-database');
const TrainingDatabase = new Database('./databases/train-ai.json');

class BotEvent {
    constructor(client) {
        this.listener = "messageCreate";
        this.once = false;

        this.client = client;
    }

    /**
     * @param {discord.Client} client 
     * @param {*} state 
     * @param {discord.Message} message 
     * @returns 
     */
    async invoke(client, state, message) {
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

        // train ai
        if (configuration.penguinAi.trainAIEnabled && message.channel.id === configuration.channels.trainAi) {
            if (message.content.startsWith("!")) return;
            // dont learn pings
            const mention = message.mentions.users.first();
            if (mention) return;
            // dont learn invalid messages
            if (message.attachments.size > 0) return;
            if (message.content.length <= 0) return;
            if (message.content.length > 1024) return;
            if (message.content.startsWith(prefix)) return;
            // dont learn links
            const urlRegex = /(http[s]?:\/\/)([a-zA-Z0-9.-]+)([\/?].*)*/g;
            if (message.content.match(urlRegex)) return;

            const messagesFromUser = TrainingDatabase.get(`m-${message.author.id}`) || [];
            messagesFromUser.push(message.content);
            TrainingDatabase.setLocal(`a-${message.author.id}`, message.author.username);
            TrainingDatabase.setLocal(`m-${message.author.id}`, messagesFromUser);
            TrainingDatabase.saveDataToFile();

            message.react("🧠");
            return;
        }
    }
}

module.exports = BotEvent;