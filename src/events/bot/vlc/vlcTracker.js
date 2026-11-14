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

        /** The last song played by VLC. @type {string} */
        this.lastSongPlayed = "";
    }

    /**
     * Runs when the event is invoked
     * @returns {Promise<any>}
     */
    async invoke() {
        if (!env.getBool("VLC_MEDIA_ENABLED")) return;
        if (!env.getBool("VLC_MEDIA_TRACKER")) return;

        // NOTE: VLC module only returns time in seconds so there's no reason to count shorter than 1 second
        setInterval(async () => {
            // NOTE: We completely ignore blocked songs and treat them like VLC isnt even on a song right now
            const isSongLoaded = VLCPoller.uri && VLCMediaPlayer.isAllowed(VLCPoller.uri);
            if (isSongLoaded) {
                if (this.lastSongPlayed !== VLCPoller.fileName) {
                    const existingSongInfo = VLCTracker.getSong(VLCPoller.fileName);
                    VLCTracker.setSong(VLCPoller.fileName, {
                        duration: VLCPoller.duration,
                        appearances: (existingSongInfo?.appearances ?? 0) + 1,
                    });
                }

                if (!VLCPoller.isPaused)
                    VLCTracker.addPlayTime(VLCPoller.fileName, 1);
            }

            this.lastSongPlayed = isSongLoaded ? VLCPoller.fileName : "";
        }, 1000);// Periodically save accumulated song statistics to disk.
        setInterval(() => {
            VLCTracker.commit();
        }, 5 * 60 * 1000);
    }
}

module.exports = BotEvent;