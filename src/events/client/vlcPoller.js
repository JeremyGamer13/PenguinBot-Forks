const env = require("../../util/env-util");
const envFill = require("../../util/env-fill");
const configuration = require("../../config");

const VLCPoller = require("../../util/vlc-poller");

class BotEvent {
    constructor(client) {
        this.listener = "ready";
        this.once = true;

        this.client = client;
    }

    async invoke(client, state) {
        if (!env.getBool("VLC_MEDIA_ENABLED")) return;
        const isInTestMode = state.isInTestMode;
        const isInPersonalMode = state.isInPersonalMode;

        console.log("vlc polling!");

        const statusText = isInTestMode ? configuration.status.testing
            : (isInPersonalMode ? configuration.status.personal : configuration.status.normal);
        try {
            VLCPoller.initialize(client, envFill(statusText));
        } catch (err) {
            console.warn("vlc thing failed", err);
        }
    }
}

module.exports = BotEvent;