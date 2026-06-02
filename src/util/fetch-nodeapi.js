const env = require("./env-util");
const fetchWithTimeout = require("./fetch-timeout");

/**
 * Fetches JGNODEAPI_URL with the JGNODEAPI_TOKEN if set
 * @param {string} endpoint ex, /api/tts, /api/ytdlp
 * @param {RequestInit} options 
 * @returns {Promise<Response>}
 */
const fetchNodeApi = async (endpoint, options = {}) => {
    if (!env.getBool("JGNODEAPI_ENABLED")) throw new Error("JG Node API is disabled");
    const url = env.get("JGNODEAPI_URL");
    const token = env.get("JGNODEAPI_TOKEN");

    const headers = { ...options.headers };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    const response = await fetchWithTimeout(`${url}${endpoint}`, {
        // NOTE: generally jg_node_api does requests quickly but we allow overrides because `ytdlp` especially will take a long time to respond
        timeout: 1 * 60 * 1000,
        ...options,
        headers
    });
    return response;
};

module.exports = fetchNodeApi;
