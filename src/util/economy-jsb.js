const env = require("./env-util.js");

class EconomyJSB {
    static activeAccount = env.get("DEVICE_LABEL");
    static createInfoLarp() {
        return {
            amount: 0,
            daily: 0,
            delayCollect: 0,
        };
    }
}

module.exports = EconomyJSB;
