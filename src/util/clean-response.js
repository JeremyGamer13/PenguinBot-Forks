const overfitting = require("./overfitting.js");

/**
 * @typedef {object} CleanResponseOptions
 * @property {number?} newlines Set an allowed number of newlines before the response is trimmed.
 * @property {boolean?} [overfitting=true] Detect overfitting and add a warning if so. Default is `true`
 */
/**
 * Cleans up a response from PenguinAI because he makes big fat stupid messages
 * @param {string} response A response from PenguinAI
 * @param {CleanResponseOptions} options 
 * @returns {string}
 */
const cleanResponse = (response, options = {}) => {
    const trimmed = response.replace(/\r/g, "").substring(0, 2000).trim();
    const newlineCount = trimmed.split("\n").length - 1;
    const likelyResponse = (typeof options.newlines !== "number" || newlineCount <= options.newlines) ? trimmed : trimmed.split("\n").shift().trim();
    const noQuoteStart = (likelyResponse.startsWith('"') ? likelyResponse.slice(1) : likelyResponse);
    const noQuotes = (noQuoteStart.endsWith('"') ? noQuoteStart.slice(0, -1) : noQuoteStart);

    // return *(no response)* if blank by this point
    if (noQuotes === "")
        return "*(no response)*";

    // detect overfitting
    if (options.overfitting !== false)
        return overfitting.appendOverfitting(noQuotes);
    return noQuotes;
}

module.exports = cleanResponse;
