const discord = require("discord.js");

const SearXNG = require("../../util/searxng.js");

class Command {
    constructor() {
        this.name = "search";
        this.description = "admin only search for testing";
        this.attributes = {
            unlisted: true,
            permission: 4,
        };
    }

    /** @param {import("discord.js").Message} message  */
    async invoke(message, args, util) {
        const searchQuery = args.join(" ").trim();
        if (searchQuery.length <= 0) return message.reply("Hey dipshit i cant search for nothing");
        
        // start asking SearXNG
        message.channel.sendTyping();
        const searchResults = await SearXNG.search(searchQuery);
        const searchDisplay = searchResults.results
            .map(result => result.url === result.title ? result.url : `[${result.title}](${result.url})`
                + "\n" + `${result.content.substring(0, 256) || "*No content*"} (${result.engine})`)
            .join("\n\n")
            .substring(0, 2000);
        message.reply({
            content: searchDisplay,
            flags: discord.MessageFlags.FLAGS.SUPPRESS_EMBEDS,
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