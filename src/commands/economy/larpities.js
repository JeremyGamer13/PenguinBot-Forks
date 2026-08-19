const Database = require('sync-json-database');
const DatabaseCurrencyLarp = new Database('./databases/currency-larp.json');

const env = require("../../util/env-util.js");
const EconomyJSB = require("../../util/economy-jsb.js");

class Command {
    constructor() {
        this.name = "larpities";
        this.description = "See hhow many larpities you have";
        this.descriptionLong = "See how many larpities (currency) you have"
            + "\n" + `All economy commands only apply to the specific economy account active right now.`
            + "\n" + `Use {{prefix}}economy for more info.`
        this.attributes = {
            helpIcon: "💲",
            unlisted: false,
            permission: 0,
        };

        this.alias = ["larpatm"];
    }

    invoke(message) {
        const info = DatabaseCurrencyLarp.get(message.author.id) || EconomyJSB.createInfoLarp();
        message.reply({
            content: `🤖🤖 Larp ATM⚡you have ${info.amount || 0} larpities`
                + "\n" + `-# looking at your **${EconomyJSB.activeAccount}** account`,
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