const env = require("./env-util.js");
const VLCMediaPlayer = require("./vlc-media-player.js");

class VLCPoller {
    /**
     * Whether or not audio is paused.
     * @type {boolean}
     */
    static isPaused = false;

    /**
     * If set, the currently playing song's file name.
     * @type {string?}
     */
    static fileName = null;
    /**
     * If set, the currently playing song's URI.
     * @type {string?}
     */
    static uri = null;
    /**
     * If set, the currently playing song's duration in seconds.
     * @type {number?}
     */
    static duration = null;
    /**
     * If set, the currently playing song's playback time in seconds.
     * @type {number?}
     */
    static time = null;

    /** @private */
    static async _iterate() {
        try {
            // this 100% will go offsync at some point, but do getFileName first
            // so we show the older song if we swapped immediately after, since we likely checked it already
            const fileName = await VLCMediaPlayer.client.getFileName();
            const playlist = await VLCMediaPlayer.client.getPlaylist();
            const isPaused = await VLCMediaPlayer.client.isPaused();
            const time = await VLCMediaPlayer.client.getTime();
            const currentSong = playlist.find(song => song.isCurrent);
            if (!currentSong)
                throw new Error("Closed");

            VLCPoller.isPaused = isPaused;
            VLCPoller.fileName = fileName;
            VLCPoller.uri = currentSong.uri;
            VLCPoller.duration = currentSong.duration;
            VLCPoller.time = time;
        } catch {
            // we just assume this is VLC being closed
            VLCPoller.isPaused = false;
            VLCPoller.fileName = null;
            VLCPoller.uri = null;
            VLCPoller.duration = null;
            VLCPoller.time = null;
        }
    }

    /**
     * Starts polling VLC for info constantly.
     * Should only run once ever.
     */
    static initialize() {
        const poll = async () => {
            await this._iterate();
            setTimeout(poll, 500);
        };
        
        poll();
    }
}

module.exports = VLCPoller;