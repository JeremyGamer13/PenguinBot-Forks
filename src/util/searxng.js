/**
 * @fileoverview Ported from Jeremy Stream Bot & adjusted
 */
/** */
const env = require("./env-util");

/*! some typings are from https://www.npmjs.com/package/searxng */
class SearXNG {
    /**
     * @typedef {"google"|"bing"|"duckduckgo"|"yahoo"|"baidu"|"wikidata"|"wikipedia"|"youtube"|"yandex"|"startpage"|"brave"} SearXNGEngine
     * An engine supported in SearXNG. The provided types are known engines, but these are likely arbitrary.
     */
    /**
     * @typedef {Object} SearXNGResult
     * @property {string} url The URL of the search result.
     * @property {string} title The title of the search result.
     * @property {string?} content Optional snippet or description of the result.
     * @property {SearXNGEngine} engine The primary engine that returned this result.
     * @property {string[]} parsed_url Array of URL components parsed from the result URL.
     * @property {'default.html'|'videos.html'|'images.html'} template The HTML template used for rendering.
     * @property {SearXNGEngine[]} engines List of all engines that contributed to this result.
     * @property {number[]} positions Positions of the result in each engine's list.
     * @property {any} publishedDate
     * @property {(string|null)} thumbnail Optional thumbnail URL.
     * @property {boolean?} is_onion Flag indicating if the result is from an onion site.
     * @property {number} score The relevance score assigned to this result.
     * @property {string} category Category of the search result (e.g., 'news', 'image').
     * @property {(string|null)} length Optional length information.
     * @property {(string|null)} duration Optional duration information for media.
     * @property {string?} iframe_src Optional source URL for embedding via iframe.
     * @property {string?} source Optional original source domain.
     * @property {string?} metadata Optional raw metadata string.
     * @property {(string|null)} resolution Optional resolution information for images/videos.
     * @property {string?} img_src URL of the image source.
     * @property {string?} thumbnail_src URL of the thumbnail image.
     * @property {'jpeg'|'png'} img_format Format of the image.
     */
    /**
     * @typedef {Object} SearXNGResults
     * @property {string} query The search query used.
     * @property {number} number_of_results Number of results returned.
     * @property {SearXNGResult[]} results Array of search result objects.
     * @property {string[]} answers
     * @property {string[]} corrections
     * @property {Array<{
     *   infobox: string;
     *   content: string;
     *   engine: string;
     *   engines: string[];
     * }>} infoboxes Array of infobox objects.
     * @property {string[]} suggestions List of suggestion strings.
     * @property {string[]} unresponsive_engines List of engines that did not respond.
     */
    /**
     * A basic list of search engines to use.
     * @type {SearXNGEngine[]}
     */
    static defaultEngines = ["duckduckgo", "google", "wikipedia"];
    
    /**
     * Search for a search query on the specified engines.
     * @param {string} query The search query to look for.
     * @param {SearXNGEngine[]|null} engines The search engines to use. If not defined, SearXNG.defaultEngines are used.
     * @returns {Promise<SearXNGResults>} The search results.
     */
    static async search(query = "", engines = SearXNG.defaultEngines) {
        if (!env.getBool("SEARXNG_ENABLED")) throw new Error("SearXNG is disabled on this system");
        if (!query) throw new Error("Need to search for a query");

        const baseUrl = env.get("SEARXNG_URL");
        const searchUrl = `${baseUrl}/search`;
        const response = await fetch(`${searchUrl}?format=json&engines=${encodeURIComponent(engines.join(","))}&q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                "Cookie": `tokens=${encodeURIComponent(env.get("SEARXNG_PRIVATE_ENGINES_TOKEN"))}`,
            }
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text);
        }

        const json = await response.json();
        return json;
    }
    /**
     * Get an autocompletion for a search query.
     * @param {string} query The search query to autocomplete.
     * @param {SearXNGEngine|null} engine The search engine to use. If not defined, SearXNG.defaultEngines[0] is used.
     * @returns {Promise<string[]>} An array of autocompletions.
     */
    static async autocomplete(query = "", engine = SearXNG.defaultEngines[0]) {
        if (!env.getBool("SEARXNG_ENABLED")) throw new Error("SearXNG is disabled on this system");
        if (!query) throw new Error("Need to autocomplete with a query");
        
        // NOTE: autocompleter doesnt actually seem to be in https://docs.searxng.org/dev/search_api.html so this can be iffy
        const baseUrl = env.get("SEARXNG_URL");
        const autocompleteUrl = `${baseUrl}/autocompleter`;
        const response = await fetch(`${autocompleteUrl}?format=json&q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                "Cookie": `autocomplete=${encodeURIComponent(engine)}; tokens=${encodeURIComponent(env.get("SEARXNG_PRIVATE_ENGINES_TOKEN"))}`,
            }
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text);
        }

        // NOTE: structure looks like ["query", ["querytracker","query meaning","query letter"]]
        const json = await response.json();
        return json[1] || [];
    }
}

module.exports = SearXNG;