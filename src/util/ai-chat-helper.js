const Ollama = require("./ollama");
const OllamaClient = new Ollama();
// OllamaClient.aiModel = "gemma3:270m";
OllamaClient.aiModel = "gemma3:4b";
OllamaClient.aiThinking = false;

class AIChatHelper {
    static client = OllamaClient;
}

module.exports = AIChatHelper;