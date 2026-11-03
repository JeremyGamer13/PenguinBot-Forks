const discord = require("discord.js");

const configuration = require("../../config.js");

const env = require("../../util/env-util.js");
const gronkResponse = require('../../util/gronk-response.js');
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
        if (!message.guild) return;

        let isReplyToGronk = false;
        let repliedMessage = null;
        if (env.getBool('RESPOND_TO_REPLIES')) {
            // check if this is a reply
            if (message.reference && message.reference.messageId) {
                repliedMessage = message.channel.messages.cache.get(message.reference.messageId);
                isReplyToGronk = repliedMessage.author.id === '750179777637515264';
            }
        }

        // check for my ping
        if (!isReplyToGronk) {
            const firstMentioned = message.mentions.members.first();
            if (!firstMentioned) return;
            if (firstMentioned.user.id !== '750179777637515264') return;
            if (!message.content.trim().startsWith('<@750179777637515264>')) return;
        }

        const responseString = await gronkResponse(message.cleanContent, message.channel, (env.getBool('RESPOND_TO_REPLIES') && repliedMessage) ? repliedMessage.cleanContent : null);
        return message.reply({
            content: responseString.substring(0, 2000),
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });
    }
}

module.exports = BotEvent;
