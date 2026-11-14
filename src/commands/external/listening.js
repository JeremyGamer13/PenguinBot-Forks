const VLCPoller = require('../../util/vlc-poller');
const FormatTime = require("../../util/format-time.js");
const ProgressBar = require("../../util/progress-bar.js");
const VLCMediaPlayer = require('../../util/vlc-media-player');

const BaseCommand = require("../../classes/base-command.js");

const clockSeconds = (inputSeconds) => {
    const minutes = Math.floor((inputSeconds % 3600) / 60);
    const seconds = Math.floor(inputSeconds % 60);
    return `${`${minutes}`.padStart(2, '0')}:${`${seconds}`.padStart(2, '0')}`;
}

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "listening";
        this.description = "what the hell is Jeremy listening to";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    async invoke(message, args, util) {
        const fileName = VLCPoller.fileName;
        if (!fileName || !VLCMediaPlayer.isAllowed(VLCPoller.uri))
            return message.reply("Nothing is playing right now.");

        const clockDisplay = `${clockSeconds(VLCPoller.time)}/${clockSeconds(VLCPoller.duration)}`;
        const progressBar = ProgressBar("blue", 10, (VLCPoller.time / VLCPoller.duration) * 100);
        message.reply({
            content: `Currently ${!VLCPoller.isPaused ? "playing" : "paused on"} **${VLCMediaPlayer.cleanUpName(fileName)}**`
                + "\n" + `${!VLCPoller.isPaused ? "🎶" : "⏸️"} \`${clockDisplay}\` - ${progressBar}`,
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;