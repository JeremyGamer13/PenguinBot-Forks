const configuration = require("../../../config.js");

const env = require("../../../util/env-util.js");
const envFill = require("../../../util/env-fill.js");
const BotState = require("../../../util/bot-state.js");
const VLCPoller = require("../../../util/vlc-poller.js");
const BotEventEmitter = require("../../../util/bot-event-emitter.js");

const BaseBotEvent = require("../../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "initialStatusSetup";
        this.once = true;

        this.handler = BotEventEmitter;
    }

    /**
     * @param {string} statusPresenceText 
     */
    async invoke(statusPresenceText) {
        if (!env.getBool("VLC_MEDIA_ENABLED")) return;
        console.log("vlc polling!");

        // initialize VLCPoller
        VLCPoller.currentStatusText = statusPresenceText;
        setInterval(async () => {
            await VLCPoller.doPoll();
        }, 500);
        setInterval(async () => {
            VLCPoller.setStatus(this.client, statusPresenceText);
        }, 5000);
    }
}

module.exports = BotEvent;