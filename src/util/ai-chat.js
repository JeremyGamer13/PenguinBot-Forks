const Ollama = require("ollama-chatting");
const OllamaModels = require("./ollama-models.js");

class AISharedChat {
    static chats = {};
    
    /**
     * Create a new Ollama chat instance and store it under the given key.
     * @param {string} key - The identifier to store the chat instance.
     * @returns {Ollama} The created Ollama instance.
     */
    static createChat(key) {
        if (!key) {
            throw new Error("Key must be provided to create a chat instance.");
        }

        const chat = new Ollama({ host: OllamaModels.url });
        AISharedChat.chats[key] = chat;
        return chat;
    }
}

module.exports = AISharedChat;