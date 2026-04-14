const VLC = require("vlc-client");

const env = require("./env-util");
const tryCatch = require("./try-catch");

const vlcBlockedTerms = tryCatch(() => require("../resources/vlc-blocked-terms.json")) || [];

const vlc = !env.getBool("VLC_MEDIA_ENABLED") ? null : new VLC.Client({
    ip: "localhost",
    port: env.getNumber("VLC_MEDIA_PORT"),
    password: env.get("VLC_MEDIA_PASSWORD"),
});
class VLCMediaPlayer {
    static client = vlc;

    static isUriAllowedSongToDisplay(uri) {
        if (!uri) return false;
        if (!uri.startsWith(env.get("VLC_MEDIA_ALLOWED_FOLDER"))) return;
        if (vlcBlockedTerms.find(term => ` ${uri.toLowerCase()} `.includes(term.toLowerCase()))) return false;
        return true;
    }
    static cleanUpName(name) {
        if (!name) return "";
        return name
            .replace(/^JP_Song\s+/, "")
            .replace(/\.[a-z0-9]+$/i, "")
            .replace(/\s*\[.*?\]\s*/g, "")
            .trim();
    }
}

module.exports = VLCMediaPlayer;
