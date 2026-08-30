const Database = require('sync-json-database');
const DatabaseCurrencyLarp = new Database('./databases/currency-larp.json');

const env = require("../../util/env-util.js");
const EconomyJSB = require("../../util/economy-jsb.js");

class Command {
    constructor() {
        this.name = "economy";
        this.description = "View information about the economy";
        this.descriptionLong = "View information about the economy"
            + "\n" + `- **Currencies:** See what other currencies exist in the economy as of now.`
            + "\n" + `- **Account:** All other economy commands & actions only apply to the specific economy account active right now.`
            + "\n" + `- **Transfer:** Any accounts listed here are accounts that you can transfer between. You can only transfer between accounts when they are available here.`
            + "\n" + `- **Trading:** You can trade currency and items between users when the trading period is active.`
            + "\n" + `- **Market:** Any markets listed here show which item markets and currency exchange markets are available right now.`
            + "\n" + `- **Stocks:** This displays which currency stock markets are active right now.`
            + "\n" + "To see your own account balances and info, use the other economy commands.";
        this.attributes = {
            helpIcon: "💲",
            unlisted: false,
            permission: 0,
        };
    }

    invoke(message) {
        message.reply({
            content: `🤖🤖⚡calculated informations`
                + "\n" + "-" + " " + `**currencies**: ${EconomyJSB.emojiLarp}`
                    + `${EconomyJSB.emojiChronos}`
                    + `${EconomyJSB.emojiElixir}`
                    + `${EconomyJSB.emojiIris}`
                    + `${EconomyJSB.emojiOPSEC}`
                + "\n" + "-" + " " + `**account**: ${EconomyJSB.activeAccount}`
                + "\n" + "-" + " " + `**transfer**: ❌its not done`
                + "\n" + "-" + " " + `**trading**: ❌its not done`
                + "\n" + "-" + " " + `**market**: ❌its not done`
                + "\n" + "-" + " " + `**stocks**: ❌its not done`
                + "\n" + "-" + " " + `**leaderboard**: ❌its not done (this entry is temp)`,
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