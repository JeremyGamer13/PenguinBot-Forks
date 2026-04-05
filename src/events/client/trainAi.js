const discord = require("discord.js");
const CommandUtility = require("../../util/utility.js");

const configuration = require("../../config.js");
const env = require("../../util/env-util.js");

const Database = require('sync-json-database');
const TrainingDatabase = new Database('./databases/train-ai.json');

const isInTestMode = process.argv[2] === 'test';
const prefix = isInTestMode ? env.get("PREFIX_TEST") : env.get("PREFIX");

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

        const isTestingInPublic = isInTestMode && !(env.getBool("CHECK_FOR_DEFAULT_TEST_SERVERS") && message.guildId === "746156168560508950")

        // ignore #spam
        if (
            message.channel.id === configuration.channels.spam
            || (message.channel.parent && message.channel.parent.id === configuration.channels.spam)
        ) return;

        CommandUtility.state = state;

        // train ai
        if (true && message.channel.id === "1490146686776119497") {
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