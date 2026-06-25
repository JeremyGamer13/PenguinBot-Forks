const discord = require("discord.js");

const env = require("../../util/env-util");
const fetchNodeApi = require("../../util/fetch-nodeapi")

class Command {
    constructor() {
        this.name = "ytdlp";
        this.description = "youtube to mp3 free online converter";
        this.attributes = {
            permission: 0,
            lockedToCommands: false,
            unlisted: false,
        };

        this.alias = ["youtube", "yt", "yt-dlp", "ytmp3"];

        this.example = [
            { text: "{{prefix}}ytdlp https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
            { text: "{{prefix}}ytdlp dQw4w9WgXcQ" },
        ];
    }

    async invoke(message, args, util) {
        const downloadUrl = args.join(" ");
        if (!downloadUrl) return message.reply("what the Fuck are you doing");

        const replyMessage = await message.reply("⌛ - downloading that to mp3 (im not adding other formats)");

        const endpoint = `/api/ytdlp?v=${encodeURIComponent(downloadUrl)}`;
        const result = await fetchNodeApi(endpoint, {
            timeout: 10 * 60 * 1000,
        });
        if (!result.ok) {
            const resultJson = await result.json();
            return replyMessage.edit(`❌ - no no bad boy\n${resultJson.error}`);
        }

        const arrayBuffer = await result.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const attachment = new discord.MessageAttachment(buffer, "download.mp3");
        replyMessage.edit({
            content: `Downloaded by <@${message.author.id}>`,
            files: [attachment]
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;