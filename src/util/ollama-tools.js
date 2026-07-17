/**
 * @fileoverview Ported from Jeremy Stream Bot & adjusted
 */
/** */
const env = require("./env-util.js");
const configuration = require("../config.js");

// TOOLS
// function (entirely functional tools on their own with implemented callbacks)
const ToolSearch = require("./ollamaTool/function/search-query.js");
const ToolTest = require("./ollamaTool/function/test.js");
// interface (mock tools that need to be called OR fully implemented in a streaming callback)
const ToolMockReact = require("./ollamaTool/interface/react.js");

class OllamaTools {
    /**
     * @param {"test"|"search-overview"|null} useCase 
     * @returns {Array<import("ollama-chatting").Tool>}
     */
    static getList(useCase) {
        switch (useCase) {
            case "test":
                // NOTE: assume no interfaces will be implemented
                return [
                    ToolSearch.getRepresentation(),
                    ToolTest.getRepresentation(),
                ];
            case "search-overview":
                return [
                    ToolSearch.getRepresentation(),
                ];
            default:
                return [];
        }
    }
}

module.exports = OllamaTools;