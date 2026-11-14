const configuration = require("../../../config.js");

const env = require("../../../util/env-util.js");
const BotState = require("../../../util/bot-state.js");
const VLCPoller = require("../../../util/vlc-poller.js");
const VLCTracker = require("../../../util/vlc-tracker.js");
const VLCMediaPlayer = require("../../../util/vlc-media-player.js");
const BotEventEmitter = require("../../../util/bot-event-emitter.js");

const BaseBotEvent = require("../../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "afterSetup";
        this.once = true;

        this.handler = BotEventEmitter;
    }

    /**
     * Runs when the event is invoked
     * @returns {Promise<any>}
     */
    async invoke() {
        if (!env.getBool("VLC_MEDIA_ENABLED")) return;
        if (!env.getBool("VLC_MEDIA_TRACKER")) return;

    }
}

module.exports = BotEvent;