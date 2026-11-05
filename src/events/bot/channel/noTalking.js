const discord = require("discord.js");

const configuration = require("../../../config.js");

const env = require("../../../util/env-util.js");
const DiscordUtility = require("../../../util/utility-discord.js");
const BotEventEmitter = require("../../../util/bot-event-emitter.js");

const BaseBotEvent = require("../../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "messageCreate";
        this.once = false;

        this.publicOnly = true;
        this.productionOnly = true;
    }

    /**
     * @param {discord.Message} message 
     * @returns 
     */
    async invoke(message) {
        // no talking
        if (!configuration.channels.funkyNoTalking) return;
        if (message.channel.id !== configuration.channels.funkyNoTalking) return;
        message.delete().catch(() => {});
    }
}

module.exports = BotEvent;