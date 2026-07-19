const Ollama = require("ollama-chatting");
const env = require("./env-util");

const ollamaUrl = env.get("OLLAMA_URL");
const OllamaTools = require("./ollama-tools");
class OllamaModels {
    static url = ollamaUrl;

    /*
     * NOTE: TRY NOT TO USE TOO MANY UNIQUE MODELS!
     * if heavy models are at play with light models, then ollama will constantly kill different models as they each
     * try to get used for different tasks and share the same RAM/VRAM space.
     *
     * having unique configs using the same model is fine.
     */
    // NOTE: These are all of type Ollama.ChatRequest but usually messages is overridden by the func that uses it
    // constant configs (settings dont change on runtime)
    /** genericIO should allow image & text input @type {Ollama.ChatRequest} */
    static genericIO = {
        model: "gemma3:4b",
        think: false,
        timeout: 2 * 60 * 1000, // 2 minutes
    };
    /** genericIO but allowed longer time @type {Ollama.ChatRequest} */
    static processorIO = {
        model: "gemma3:4b",
        think: false,
        timeout: 5 * 60 * 1000, // 5 minutes
    };
    /** @type {Ollama.ChatRequest} */
    static messageRewriter = {
        model: "gemma3:1b",
        think: false,
        timeout: 1 * 60 * 1000, // 1 minute
    };
    /** @type {Ollama.ChatRequest} */
    static lightText = {
        model: "gemma3:1b",
        think: false,
        timeout: 1 * 60 * 1000, // 1 minute
    };
    /** must have access to tools @type {Ollama.ChatRequest} */
    static robChatter = {
        model: "gemma4:e2b",
        think: false,
        timeout: 15 * 60 * 1000, // 15 minutes
        tools: OllamaTools.getList("rob"),
    };
    /** must have access to tools @type {Ollama.ChatRequest} */
    static searchOverview = {
        model: "gemma4:e2b",
        think: true,
        timeout: 5 * 60 * 1000, // 5 minutes
        tools: OllamaTools.getList("search-overview"),
    };
    /** @type {Ollama.ChatRequest} */
    static svgCoder = {
        model: "gemma4:e4b",
        think: false,
        timeout: 5 * 60 * 1000, // 5 minutes
        options: {
            num_ctx: 8192
        },
    };
    /** same as svgCoder but a vision model (IF VISION DISABLED, DONT DISABLE THIS MODEL OR IT USUALLY DISABLES svgCoder TOO) @type {Ollama.ChatRequest} */
    static svgCoderImage = {
        model: "gemma4:e4b",
        think: false,
        timeout: 10 * 60 * 1000, // 10 minutes
        options: {
            num_ctx: 8192
        },
    };

    // configs where settings can be adjusted on runtime, probably with cmds
    /** @type {Ollama.ChatRequest} */
    static mutatableChatbot = {
        model: "gemma4:e2b", // this is very likely to be adjusted
        think: false,
        timeout: 5 * 60 * 1000, // 5 minutes
    };
}

module.exports = OllamaModels;