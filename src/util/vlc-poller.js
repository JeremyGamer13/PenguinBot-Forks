const VLCMediaPlayer = require("./vlc-media-player");
const env = require("./env-util");

class VLCPoller {
    /** @param {import("discord.js").Client} client  */
    static initialize(client, statusText) {
        if (!env.getBool("VLC_MEDIA_ENABLED")) return;

        this.currentStatusText = statusText;
        setInterval(async () => {
            await this.doPoll();
        }, 5000);
        setInterval(async () => {
            this.setStatus(client, statusText);
        }, 20000);
    }

    static currentStatusText = "this will never be the status text haha";

    /** @type {string?} */
    static currentSong = null;

    static setStatus(client, defaultText) {
        // make the new text
        let newText = defaultText;
        const currentSong = this.currentSong;
        if (currentSong) {
            newText = `🎶 ${VLCMediaPlayer.cleanUpName(this.currentSong)}`.substring(0, 128);
        }

        // compare to previous
        if (this.currentStatusText === newText) return;
        this.currentStatusText = newText;

        console.log("updating status on discorrd", newText);
        client.user.setPresence({
            status: "online",
            activities: [{
                name: newText,
                type: !currentSong ? "PLAYING" : "LISTENING"
            }]
        });
    }
    static async doPoll() {
        try {
            // this 100% will go offsync at some point, but do getFileName first
            // so we show the older song if we swapped immediately after, since we likely checked it already
            const fileName = await VLCMediaPlayer.client.getFileName();
            const playlist = await VLCMediaPlayer.client.getPlaylist();
            const currentSong = playlist.find(song => song.isCurrent);
            if (!currentSong) {
                VLCPoller.currentSong = null;
                return null;
            }

            const isAllowed = VLCMediaPlayer.isUriAllowedSongToDisplay(currentSong.uri);
            if (!isAllowed) {
                VLCPoller.currentSong = null;
                return null;
            }

            VLCPoller.currentSong = fileName;
            return currentSong;
        } catch {
            // we just assume this is VLC being closed
            VLCPoller.currentSong = null;
            return null;
        }
    }
}

module.exports = VLCPoller;