const SearXNG = require("../../searxng.js");

class ToolSearch {
    /**
     * @returns {import("ollama-chatting").Tool}
     */
    static getRepresentation() {
        return {
            type: 'function',
            function: {
                name: 'search-query',
                description: 'Search for any query on an external real-time search engine.',
                callback: this.execute.bind(this),
                parameters: {
                    type: 'object',
                    required: ['query'],
                    properties: {
                        query: { type: 'string', description: 'The query to search for.' },
                    },
                },
            },
        }
    }

    /**
     * @param {import("ollama").ToolCall} call 
     */
    static async execute(call) {
        const query = String(call.function.arguments.query).trim().substring(0, 256);
        if (!query) return "No results found.";
        const searchResults = await SearXNG.search(query);
        if (searchResults.number_of_results <= 0) return "No results found.";
        return searchResults.results.map((result, index) => `--- START OF RESULT ${index + 1} ---`
            + "\n" + `* Title: ${result.title}`
            + "\n" + `* URL: ${result.url}`
            + "\n" + `* Found this result on: ${result.engine}`
            + "\n" + `${(result.content || "No content found for this result.").substring(0, 300)}`
            + "\n" + `--- END OF RESULT ${index + 1} ---`).slice(0, 10).join("\n\n");
    }
}

module.exports = ToolSearch;
