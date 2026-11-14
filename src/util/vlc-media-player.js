const VLC = require("vlc-client");

const env = require("./env-util.js");
const tryCatch = require("./try-catch.js");

const vlcBlockedTerms = tryCatch(() => require("../resources/vlc-blocked-terms.json")) || [];

class VLCMediaPlayer {
    static client = !env.getBool("VLC_MEDIA_ENABLED") ? null : new VLC.Client({
        ip: "localhost",
        port: env.getNumber("VLC_MEDIA_PORT"),
        password: env.get("VLC_MEDIA_PASSWORD"),
    });

    /**
     * Determines if a song URI is within the VLC_MEDIA_ALLOWED_FOLDER and is allowed to display on bot status.
     * @param {string} uri 
     * @returns {boolean}
     */
    static isAllowed(uri) {
        if (!uri) return false;
        if (!uri.startsWith(env.get("VLC_MEDIA_ALLOWED_FOLDER"))) return false;
        if (vlcBlockedTerms.find(term => ` ${uri.toLowerCase()} `.includes(term.toLowerCase()))) return false;
        return true;
    }
    /**
     * Cleans up a file name for display (very subjective cleanup)
     * @param {string} name 
     * @returns {string}
     */
    static cleanUpName(name) {
        if (!name) return "";
        return `${name}`
            .replace(/^(JP_Song|JP_SongMashup|Vocaloid Song \-|Vocaloid Song Mashup \-)\s+/, "")
            .replace(/\.[a-z0-9]+$/i, "")
            .replace(/\s*\[.*?\]\s*/g, "")
            .replace(/\s-(\s|)$/m, "")
            .trim();
    }
}

module.exports = VLCMediaPlayer;
