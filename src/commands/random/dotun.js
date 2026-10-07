class Command {
    constructor(client) {
        this.name = "dotun";
        this.description = "Oh yea";
        this.attributes = {
            permission: 0,
            unlisted: true,
        };
    }

    invoke(message) {
        message.reply("https://cdn.discordapp.com/attachments/1038238583686967428/1556413132887425035/tiktok_sienalabri_7691417178150636831-ezgif.com-video-to-gif-converter.gif?backend=b2");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;