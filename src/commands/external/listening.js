const VLCMediaPlayer = require('../../util/vlc-media-player');
const VLCPoller = require('../../util/vlc-poller');

class Command {
    constructor() {
        this.name = "listening";
        this.description = "what the hell is Jeremy listening to";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    async invoke(message) {
        const currentSong = VLCPoller.currentSong;
        if (!currentSong) return message.reply("Nothing is playing right now.");
        message.reply({
            content: `Currently playing **${VLCMediaPlayer.cleanUpName(currentSong)}**`,
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