const discord = require("discord.js");

const env = require("../../util/env-util");
const fetchWithTimeout = require("../../util/fetch-timeout")

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
    }

    async invoke(message, args, util) {
        const downloadUrl = args.join(" ");
        if (!downloadUrl) return message.reply("what the Fuck are you doing");

        const replyMessage = await message.reply("⌛ - downloading that to mp3 (im not adding other formats)");

        // TODO: Implement JGNODEAPI_TOKEN once added to jg_node_api
        const nodeApiUrl = `${env.get("JGNODEAPI_URL")}/api/ytdlp?v=${encodeURIComponent(downloadUrl)}`;
        const result = await fetchWithTimeout(nodeApiUrl, {
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