const Database = require('sync-json-database');
const DatabaseCurrencyLarp = new Database('./databases/currency-larp.json');

const env = require("../../util/env-util.js");
const EconomyJSB = require("../../util/economy-jsb.js");

class Command {
    constructor() {
        this.name = "larp";
        this.description = "get larpities";
        this.attributes = {
            helpIcon: "💲",
            unlisted: false,
            permission: 0,
        };

        this.alias = ["larpcollect"];
    }

    invoke(message) {
        const userId = message.author.id;
        if (!DatabaseCurrencyLarp.has(userId))
            DatabaseCurrencyLarp.setLocal(userId, EconomyJSB.createInfoLarp())
        const info = DatabaseCurrencyLarp.get(userId);
        if (Date.now() < info.delayCollect)
            return message.reply(`no stop you cant do that, you can <t:${Math.round(info.delayCollect / 1000)}:R>`);

        // colects
        const money = Math.floor(Math.random() * 9) + 1;
        info.amount += money;
        if (info.amount > info.amountHighest)
            info.amountHighest = info.amount;
        info.delayCollect = Date.now() + 5 * 60 * 1000;
        DatabaseCurrencyLarp.set(userId, info);
        message.reply({
            content: `Ok you got ${money} ${EconomyJSB.emojiLarp}`,
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