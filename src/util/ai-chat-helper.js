const Ollama = require("./ollama");
const OllamaClient = new Ollama();
// OllamaClient.aiModel = "gemma3:270m";
OllamaClient.aiModel = "gemma3:4b";
OllamaClient.aiThinking = false;
OllamaClient.timeout = 5 * 60 * 1000; // 5 minutes

class AIChatHelper {
    static client = OllamaClient;
}

module.exports = AIChatHelper;