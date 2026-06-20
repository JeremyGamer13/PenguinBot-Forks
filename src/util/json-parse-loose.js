// DISCLOSURE: ai written pretty much
const JSON5 = require('json5');
const { jsonrepair } = require('jsonrepair');

/**
 * A loose JSON parser that is not *entirely* noise tolerant but very noise tolerant
 * Intended to parse:
 * 
 * - cases where the json starts with non-json text (ie, "Here is your json: {")
 * - cases where the json is encased in a code-block (ie, "```json{...")
 * - cases where Fancy quotation marks are used *outside* of actual keys and values (ie, “” and ‘’)
 * - json5 syntax
 * - broken JSON syntax in general
 * 
 * @param {string} text the string to parse
 * @returns {any}
 */
const jsonParseLoose = (text) => {
    // Trim whitespace and remove any leading non‑JSON text such as a description or code block markers.
    let cleaned = text.trim();

    // Remove common Markdown code block prefixes like ```json or ````
    cleaned = cleaned.replace(/^```\s*json?\s*/i, "");
    cleaned = cleaned.trim();
    cleaned = cleaned.replace(/^```/i, "");

    // Find the first opening brace or bracket that likely starts the JSON payload
    const jsonStart = cleaned.search(/[{\[]/);
    if (jsonStart !== -1) {
        cleaned = cleaned.slice(jsonStart);
    }
    
    // jsonrepair returns a string of valid JSON
    const repairedJsonString = jsonrepair(cleaned);
    return JSON5.parse(repairedJsonString);
}

module.exports = jsonParseLoose;