const env = require("./env-util.js");

class EconomyJSB {
    static activeAccount = env.get("DEVICE_LABEL");

    // emojis
    static emojiLarp = `<:larp:1539498244982181928>`;
    static emojiChronos = `<:chronos:1539499215900647535>`;
    static emojiElixir = `<:elixir:1539499628582670336>`;
    static emojiIris = `<:iris:1539500722385588294>`;

    // user infos
    /**
     * larp (larpities) is our cheap bum currency
     * you can get them via
     * - daily
     * - collecting every 5 mins
     * intended values: signed integer (+-)
     */
    static createInfoLarp() {
        return {
            amount: 0,
            amountHighest: 0,
            daily: 0,
            delayCollect: 0,
        };
    }
    /**
     * Chronos is a futuristic esque currency
     * you can get them via
     * - Chatting
     * - Chatting more
     * intended values: positive float
     */
    static createInfoChronos() {
        return {
            amount: 0,
            amountHighest: 0,
            activeTime: 0,
            lastMessageTime: 0,
        };
    }
    /**
     * Elixir is a barbaric style currency
     * you can get them via
     * - Elixir Collector
     * intended values: unsigned integer
     */
    static createInfoElixir() {
        return {
            amount: 0,
            amountHighest: 0,
            collectors: [],
        };
    }
    /**
     * Iris is an eye-styled currency
     * you can get them via
     * - talking to AI to convince them to give you some
     * - getting a streak of convincing
     * you can LOSE them via
     * - talking to AI and they DONT like you which RESETS your iris
     * intended values: signed float
     */
    static createInfoIris() {
        return {
            amount: 0,
            amountHighest: 0,
            streak: 0,
            streakHighest: 0,
            delayTalk: 0,
        };
    }

    // objects
    /**
     * Elixir Collector (Elixir Collectors) geenerate 500 Elixir over 1 week
     * use lastCollected and currnet date to calculate how many elixir
     * they burn out after a week and cant be collected if burnt out
     * @param {string} id 
     */
    static createObjectElixirCollector(id) {
        return {
            id: `${id}`,
            lastCollected: Date.now(),
            builtAt: Date.now(),
            burnsAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
        }
    }
}

module.exports = EconomyJSB;
