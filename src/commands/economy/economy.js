const Database = require('sync-json-database');
const DatabaseCurrencyLarp = new Database('./databases/currency-larp.json');

const env = require("../../util/env-util.js");
const EconomyJSB = require("../../util/economy-jsb.js");

class Command {
    constructor() {
        this.name = "economy";
        this.description = "View information about the economy";
        this.attributes = {
            helpIcon: "💲",
            unlisted: false,
            permission: 0,
        };
    }

    invoke(message) {
        const info = DatabaseCurrencyLarp.get(message.author.id) || EconomyJSB.createInfoLarp();
        message.reply({
            content: `🤖🤖⚡calculated informations`
                + "\n" + "-" + " " + `**currencies**: ${EconomyJSB.emojiLarp}`
                    + `${EconomyJSB.emojiChronos}`
                    + `${EconomyJSB.emojiElixir}`
                    + `${EconomyJSB.emojiIris}`
                + "\n" + "-" + " " + `**account**: ${EconomyJSB.activeAccount}`
                + "\n" + "-" + " " + `**transfer**: ❌its not done`
                + "\n" + "-" + " " + `**trading**: ❌its not done`
                + "\n" + "-" + " " + `**market**: ❌its not done`
                + "\n" + "-" + " " + `**stocks**: ❌its not done`
                + "\n" + "-" + " " + `**leaderboard**: ❌its not done`,
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