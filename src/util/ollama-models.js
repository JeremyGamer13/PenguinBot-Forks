/**
 * @fileoverview Ported from Jeremy Stream Bot & adjusted
 */
/** */
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
    /** @type {Ollama.ChatRequest} */
    static penguinAI = {
        model: "custom-penguinmod-server-v5",
        think: false,
        timeout: 1.5 * 60 * 1000, // 1.5 minute
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
        model: "gemma4:12b",
        think: false,
        timeout: 5 * 60 * 1000, // 5 minutes
        options: {
            num_ctx: 8192
        },
    };
    /** same as svgCoder but a vision model (IF VISION DISABLED, DONT DISABLE THIS MODEL OR IT USUALLY DISABLES svgCoder TOO) @type {Ollama.ChatRequest} */
    static svgCoderImage = {
        model: "gemma4:12b",
        think: false,
        timeout: 10 * 60 * 1000, // 10 minutes
        options: {
            num_ctx: 8192
        },
    };
}

module.exports = OllamaModels;