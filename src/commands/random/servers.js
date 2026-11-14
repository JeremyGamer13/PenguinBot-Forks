const discord = require("discord.js");

const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "servers";
        this.description = "See what servers the bot is in. Intended for private, single-server bots (like Jeremy Stream Bot)";
        this.attributes = {
            permission: 4,
            unlisted: true,
        };

        /**
         * @type {discord.Client}
         */
    }

    async invoke(message, args, util) {
        const guildList = this.client.guilds.cache.map(guild => `- **${guild.name}** (${guild.id})`);
        message.reply({
            content: `Currently in **${this.client.guilds.cache.size}** server(s)`
                + `\n` + guildList.join("\n")
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;