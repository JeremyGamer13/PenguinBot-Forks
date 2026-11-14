const configuration = require("../../../config.js");

const env = require("../../../util/env-util.js");
const envFill = require("../../../util/env-fill.js");
const BotState = require("../../../util/bot-state.js");
const VLCPoller = require("../../../util/vlc-poller.js");
const VLCMediaPlayer = require("../../../util/vlc-media-player.js");
const BotEventEmitter = require("../../../util/bot-event-emitter.js");

const BaseBotEvent = require("../../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "initialStatusSetup";
        this.once = true;

        this.handler = BotEventEmitter;

        /** @private What the status is on Discord; Live */
        this._currentStatusText = "";
    }

    /**
     * @param {string} statusPresenceText 
     */
    async invoke(statusPresenceText) {
        if (!env.getBool("VLC_MEDIA_ENABLED")) return;
        this._currentStatusText = statusPresenceText;

        // use statusPresenceText as a default, and _currentStatusText as the live status
        setInterval(async () => {
            const newText = (!VLCPoller.uri || !VLCMediaPlayer.isAllowed(VLCPoller.uri)) ? statusPresenceText
                : `${!VLCPoller.isPaused ? "🎶" : "⏸️"} ${VLCMediaPlayer.cleanUpName(VLCPoller.fileName)}`.substring(0, 128);
            if (this._currentStatusText === newText) return;
            this._currentStatusText = newText;

            console.log("updating status on discorrd", newText);
            this.client.user.setPresence({
                status: "online",
                activities: [{
                    name: newText,
                    type: !VLCPoller.uri ? "PLAYING" : "LISTENING"
                }]
            });
        }, 5000);
    }
}

module.exports = BotEvent;