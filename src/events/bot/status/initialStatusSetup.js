const configuration = require("../../../config.js");

const env = require("../../../util/env-util.js");
const envFill = require("../../../util/env-fill.js");
const BotState = require("../../../util/bot-state.js");
const BotEventEmitter = require("../../../util/bot-event-emitter.js");

const BaseBotEvent = require("../../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "afterSetup";
        this.once = true;

        this.handler = BotEventEmitter;
    }

    async invoke() {
        // set our status
        const statusText = this.isInTestMode ? configuration.status.testing
            : (this.isInPersonalMode ? configuration.status.personal : configuration.status.normal);
        const filledText = envFill(statusText);
        this.client.user.setPresence({
            status: "online",
            activities: [{
                name: filledText,
                type: "PLAYING"
            }]
        });

        BotState.state.statusPresenceText = filledText;
        BotEventEmitter.emit("initialStatusSetup", filledText);
    }
}

module.exports = BotEvent;