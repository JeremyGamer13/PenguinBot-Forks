const env = require("./env-util.js");
const configuration = require("../config.js");

// TOOLS
// function (entirely functional tools on their own with implemented callbacks)
const ToolVLCListening = require("./ollamaTool/function/get-host-listening.js");
const ToolSystemInfo = require("./ollamaTool/function/get-system-info.js");
const ToolPause = require("./ollamaTool/function/pause.js");
const ToolTest = require("./ollamaTool/function/test.js");
// interface (mock tools that need to be called OR fully implemented in a streaming callback)
const ToolMockReact = require("./ollamaTool/interface/react.js");
const ToolMockRob = require("./ollamaTool/interface/tell-rob.js");

class OllamaTools {
    /**
     * @param {"aichat-prompt"|"test"|"rob"|null} useCase 
     * @returns {Array<import("ollama-chatting").Tool>}
     */
    static getList(useCase) {
        const vlcEnabled = env.getBool("VLC_MEDIA_ENABLED");
        switch (useCase) {
            case "aichat-prompt":
                return [
                    ...(vlcEnabled ? [ToolVLCListening.getRepresentation()] : []),
                    ToolSystemInfo.getRepresentation(),
                    ToolPause.getRepresentation(),
                    ToolMockReact.getRepresentation(),
                    ToolMockRob.getRepresentation(),
                ];
            case "test":
                // NOTE: assume no interfaces will be implemented
                return [
                    ...(vlcEnabled ? [ToolVLCListening.getRepresentation()] : []),
                    ToolSystemInfo.getRepresentation(),
                    ToolPause.getRepresentation(),
                    ToolTest.getRepresentation(),
                ];
            case "rob":
                // NOTE: these can allow conversational tools & topic starters like "im listening to xyz"
                return [
                    ...(vlcEnabled ? [ToolVLCListening.getRepresentation()] : []),
                    ToolSystemInfo.getRepresentation(),
                    ToolPause.getRepresentation(),
                    ToolMockRob.getRepresentation(),
                ];
            default:
                return [];
        }
    }
}

module.exports = OllamaTools;