const Ollama = require("ollama-chatting");
const env = require("./env-util");

const ollamaUrl = env.get("OLLAMA_URL");
class OllamaClients {
    // values
    /** Any models you want people to be able to use on the bot */
    static AVAILABLE_MODELS = [
        "custom-penguinmod-server-v1",
        "gemma4:e4b",
        "gemma4:e2b",
        "gemma3:12b",
        "gemma3:4b",
        "gemma3:1b",
        "gemma3:270m",
        "qwen3-vl:8b",
        "qwen3-vl:4b",
        "qwen3-vl:2b",
        "qwen3:8b",
        "qwen3:4b",
        "deepseek-r1:8b",
    ];

    /*
        NOTE: TRY NOT TO USE TOO MANY UNIQUE MODELS
        if heavy models are at play with light models, then
        ollama will constantly kill different models as they each
        try to get used for different tasks

        having unique clients using the same model is fine
    */
    // constant clients (settings dont change on runtime)
    /** genericIO should allow image & text input */
    static genericIO = new Ollama({
        model: "gemma3:4b",
        thinking: false,
        timeout: 25 * 1000, // 25 seconds
        url: ollamaUrl,
    });
    /** genericIO but allowed longer time */
    static processorIO = new Ollama({
        model: "gemma3:4b",
        thinking: false,
        timeout: 5 * 60 * 1000, // 5 minutes
        url: ollamaUrl,
    });
    static messageRewriter = new Ollama({
        model: "gemma3:4b",
        thinking: false,
        timeout: 8 * 1000, // 8 seconds
        url: ollamaUrl,
    });
    static lightText = new Ollama({
        model: "gemma3:1b",
        thinking: false,
        timeout: 25 * 1000, // 25 seconds
        url: ollamaUrl,
    });
    static penguinGPT = new Ollama({
        model: "custom-penguinmod-server-v1",
        thinking: false,
        timeout: 60 * 1000, // 1 minute
        url: ollamaUrl,
    });
    static tuffScript = new Ollama({
        model: "gemma3:12b", // TODO: do we need 12b for this
        // model: "deepseek-r1:8b",
        thinking: false,
        timeout: 2 * 60 * 1000, // 2 minutes
        url: ollamaUrl,
    });

    // clients where settings can be adjusted , probably with cmds
    static mutatableChatbot = new Ollama({
        model: "gemma4:e2b", // this is very likely to be adjusted
        thinking: false,
        timeout: 5 * 60 * 1000, // 5 minutes
        url: ollamaUrl,
    });
}

module.exports = OllamaClients;