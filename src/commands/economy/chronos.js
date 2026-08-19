const discord = require("discord.js");

const Database = require('sync-json-database');
const DatabaseCurrencyChronos = new Database('./databases/currency-chronos.json');

const env = require("../../util/env-util.js");
const EconomyJSB = require("../../util/economy-jsb.js");

class Command {
    constructor() {
        this.name = "chronos";
        this.description = `View the amount of Chronos ${EconomyJSB.emojiChronos} you own.`;
        this.descriptionLong = `View the amount of Chronos ${EconomyJSB.emojiChronos} you own.`
            + "\n" + `You can obtain Chronos ${EconomyJSB.emojiChronos} by talking in chat often.`
            + "\n" + `All economy commands only apply to the specific economy account active right now.`
            + "\n" + `Use {{prefix}}economy for more info.`
        this.attributes = {
            helpIcon: "💲",
            unlisted: false,
            permission: 0,
        };

        this.alias = ["chronosatm"];
    }

    invoke(message) {
        const info = DatabaseCurrencyChronos.get(message.author.id) || EconomyJSB.createInfoChronos();

        const embed = new discord.MessageEmbed();
        embed.setColor("BLURPLE");
        embed.setTitle(`Chronos Balance`);
        embed.setDescription(`# ***${info.amount}*** ${EconomyJSB.emojiChronos}`);
        embed.setFields([
            {
                name: "⚡ Highest",
                value: `*${info.amountHighest}* ${EconomyJSB.emojiChronos}`,
                inline: true,
            }
        ]);
        message.reply({
            embeds: [embed],
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