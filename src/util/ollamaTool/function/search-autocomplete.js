const SearXNG = require("../../searxng.js");

class ToolSearchAutocomplete {
    /**
     * @returns {import("ollama-chatting").Tool}
     */
    static getRepresentation() {
        return {
            type: 'function',
            function: {
                name: 'autocomplete-query',
                description: 'Completes a partial search query with possible, intended queries.',
                callback: this.execute.bind(this),
                parameters: {
                    type: 'object',
                    required: ['query'],
                    properties: {
                        query: { type: 'string', description: 'The partial query to autocomplete.' },
                    },
                },
            },
        }
    }

    /**
     * @param {import("ollama").ToolCall} call 
     */
    static async execute(call) {
        const query = String(call.function.arguments.query).trim().substring(0, 64);
        if (!query) return "nothing";
        const completions = await SearXNG.autocomplete(query);
        if (completions.length <= 0) return query;
        return completions.slice(0, 10).join("\n");
    }
}

module.exports = ToolSearchAutocomplete;
