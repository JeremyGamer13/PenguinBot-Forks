const discord = require("discord.js");

const configuration = require("../../config.js");

const Database = require('sync-json-database');
const TrainingDatabase = new Database('./databases/train-ai.json');

const env = require("../../util/env-util.js");
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
     * Runs when the event is invoked
     * @param {import("discord.js").Message} message 
     * @returns {Promise<any>}
     */
    async invoke(message) {
        // ai must be enabled & this must be the training channel
        if (!configuration.penguinAi.trainAIEnabled) return;
        if (message.channel.id !== configuration.channels.trainAi) return;
        // train ai
        if (message.content.startsWith("!")) return;
        // dont learn pings
        const mention = message.mentions.users.first();
        if (mention) return;
        // dont learn invalid messages
        if (message.attachments.size > 0) return;
        if (message.content.length <= 0) return;
        if (message.content.length > 1024) return;
        // dont learn links
        const urlRegex = /(http[s]?:\/\/)([a-zA-Z0-9.-]+)([\/?].*)*/g;
        if (message.content.match(urlRegex)) return;

        const messagesFromUser = TrainingDatabase.get(`m-${message.author.id}`) || [];
        messagesFromUser.push(message.content);
        TrainingDatabase.setLocal(`a-${message.author.id}`, message.author.username);
        TrainingDatabase.setLocal(`m-${message.author.id}`, messagesFromUser);
        TrainingDatabase.saveDataToFile();

        // add a little note (but ignore ratelimit errors when users are spamming training data)
        message.react("🧠").catch(() => {});
    }
}

module.exports = BotEvent;