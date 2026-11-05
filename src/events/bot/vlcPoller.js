const configuration = require("../../config.js");

const env = require("../../util/env-util.js");
const envFill = require("../../util/env-fill.js");
const VLCPoller = require("../../util/vlc-poller.js");

const BaseBotEvent = require("../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "ready";
        this.once = true;
    }

    async invoke() {
        if (!env.getBool("VLC_MEDIA_ENABLED")) return;
        console.log("vlc polling!");

        const statusText = this.isInTestMode ? configuration.status.testing
            : (this.isInPersonalMode ? configuration.status.personal : configuration.status.normal);
        try {
            VLCPoller.initialize(this.client, envFill(statusText));
        } catch (err) {
            console.warn("vlc thing failed", err);
        }
    }
}

module.exports = BotEvent;