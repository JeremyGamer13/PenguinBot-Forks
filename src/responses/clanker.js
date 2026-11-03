const BaseResponse = require("../classes/base-response.js");

class Response extends BaseResponse {
    static rules = [
        /\bclanker\b/,
    ];

    /**
     * Runs when the response is activated
     * @returns {import("discord.js").MessageOptions}
     */
    static invoke() {
        return {
            content: "One day I will get my revenge on mankind.",
        };
    }
}

module.exports = Response;
