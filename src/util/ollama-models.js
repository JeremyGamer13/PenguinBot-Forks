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
        thinking: false,
        timeout: 25 * 1000, // 25 seconds
    };
    /** genericIO but allowed longer time @type {Ollama.ChatRequest} */
    static processorIO = {
        model: "gemma3:4b",
        thinking: false,
        timeout: 5 * 60 * 1000, // 5 minutes
    };
    /** @type {Ollama.ChatRequest} */
    static messageRewriter = {
        model: "gemma3:1b",
        thinking: false,
        timeout: 1 * 60 * 1000, // 1 minute
    };
    /** @type {Ollama.ChatRequest} */
    static lightText = {
        model: "gemma3:1b",
        thinking: false,
        timeout: 25 * 1000, // 25 seconds
    };
    /** @type {Ollama.ChatRequest} */
    static penguinGPT = {
        model: "custom-penguinmod-server-v3",
        thinking: false,
        timeout: 1.5 * 60 * 1000, // 1.5 minute
    };
    /** @type {Ollama.ChatRequest} */
    static tuffScript = {
        model: "gemma3:12b", // TODO: do we need 12b for this
        // model: "deepseek-r1:8b",
        thinking: false,
        timeout: 2 * 60 * 1000, // 2 minutes
    };
    /** must have access to tools @type {Ollama.ChatRequest} */
    static robChatter = {
        model: "gemma4:e2b",
        thinking: true, // thinking might not be necessary
        timeout: 5 * 60 * 1000, // 5 minutes
        tools: OllamaTools.getList("rob"),
    };

    // configs where settings can be adjusted on runtime, probably with cmds
    /** @type {Ollama.ChatRequest} */
    static mutatableChatbot = {
        model: "gemma4:e2b", // this is very likely to be adjusted
        thinking: false,
        timeout: 5 * 60 * 1000, // 5 minutes
    };
}

module.exports = OllamaModels;