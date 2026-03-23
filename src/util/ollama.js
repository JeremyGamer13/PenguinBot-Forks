// credits to the work done by these folk:
// https://github.com/14-3dgar/turboGPT
// https://github.com/Anonymous-cat1/WorkingTurboGPT
// PenguinGPT and PenguinAI by Ruby Team, MubiLop, and others
// this is just a modification to work with ollama's API (locally ran AI)
const fetchWithTimeout = require("./fetch-timeout");
const env = require("./env-util");

class OllamaClient {
    constructor() {
        this.chatHistories = {};
        this.currentIndex = 0;

        // lightweight ollama model i have rn
        this.aiModel = 'gemma3:4b';
        this.timeout = 25 * 1000; // 25 seconds

        this._api_url = env.get("OLLAMA_URL");
    }

    get apiUrl() {
        return this._api_url;
    }
    set apiUrl(url) {
        const newApiUrl = url;
        // Update the api_url variable
        this._api_url = newApiUrl;
    }

    /**
     * Uses a generation to check that the api is working
     * @returns {Promise<void>}
     */
    checkApiUrl() {
        // Send a simple GET request to the api_url
        return fetchWithTimeout(this._api_url, {
            method: 'POST',
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.aiModel,
                stream: false,
                messages: [{ role: "user", content: "Return nothing" }]
            }),
        })
            .then(response => {
                // Check if the response status code is in the 200 range (success)
                return response.status >= 200 && response.status < 300;
            })
            .catch(() => {
                // If there's an error, return false
                return false;
            });
    }

    createChat(chatIDd) {
        const chatID = chatIDd;
        if (!(chatID in this.chatHistories)) {
            this.chatHistories[chatID] = [];
        }
    }

    chatExists(chatID) {
        return chatID in this.chatHistories;
    }

    informChat(chatID, inform) {
        if (chatID in this.chatHistories) {
            this.chatHistories[chatID].push({ role: "system", content: inform });
        }
    }
    /**
     * @param {"user"|"assistant"|"system"} role 
     */
    informChatWithRole(chatID, role, inform) {
        if (chatID in this.chatHistories) {
            this.chatHistories[chatID].push({ role, content: inform });
        }
    }

    /**
     * @param {"user"|"assistant"} type 
     */
    lastGeneration(chatID, type) {
        if (type === 'user') {
            type = 'user';
        } else {
            type = 'assistant';
        }
        if (this.chatHistories[chatID] !== undefined) {
            const chatHistory = this.chatHistories[chatID];
            for (let i = chatHistory.length - 1; i >= 0; i--) {
                if ('role' in chatHistory[i] && chatHistory[i].role === type) {
                    return chatHistory[i].content;
                }
            }
        }
        return '';
    }

    exportChat(chatID) {
        if (this.chatHistories[chatID] !== undefined) {
            const chatHistory = this.chatHistories[chatID];
            return chatHistory;
        } else {
            return '';
        }
    }

    listChats() {
        const activeChats = Object.keys(this.chatHistories);
        return activeChats;
    }

    importChat(chatID, chatHistory) {
        if (Array.isArray(chatHistory)) {
            this.chatHistories[chatID] = chatHistory;
        } else {
            throw new Error('Invalid JSON format. Expected an array.');
        }
    }

    resetChat(chatID) {
        if (chatID in this.chatHistories) {
            this.chatHistories[chatID] = [];
        }
    }

    removeChat(chatID) {
        if (chatID in this.chatHistories) {
            delete this.chatHistories[chatID];
        }
    }

    chatWithMessages(messages, format) {
        return fetchWithTimeout(this._api_url, {
            method: 'POST',
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.aiModel,
                stream: false,
                messages,
                format
            })
        })
            .then(response => {
                if (!response.ok) {
                    response.text().then(console.log);
                    throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (format) console.log(data);

                let botResponse = null;
                if (data.message && data.message.content) {
                    botResponse = data.message.content;
                } else if (data.choices && data.choices.length > 0) {
                    botResponse = data.choices[0].message.content;
                } else {
                    throw new Error("Unexpected response from the API");
                }

                return botResponse;
            })
            .catch(error => {
                console.error("Error sending prompt to AI", error.message);
                console.error(this._api_url);

                // Handle different error scenarios with custom messages
                if (error.message === "Unexpected response from the API") {
                    throw new Error("Unexpected response from AI");
                } else if (error.message === "Network response was not ok: 429 Too Many Requests") {
                    throw new Error("Too many requests. Please try again later");
                } else {
                    throw new Error("An unexpected error occurred. Please try again later");
                }
            });
    }

    async singlePrompt(prompt, imageBuffer) {
        const messages = [{
            role: "user",
            content: prompt,
            images: !imageBuffer ? [] : [imageBuffer.toString("base64")],
        }];
        return this.chatWithMessages(messages);
    }
    /**
     * Prompt for a specific chatID
     * @param {string} chatID 
     * @param {string} prompt 
     * @param {Buffer} imageBuffer 
     * @returns {Promise<string>}
     */
    async chatPrompt(chatID, prompt, imageBuffer) {
        if (!(chatID in this.chatHistories)) {
            throw new Error("That chatbot does not exist");
        }

        const chatHistory = this.chatHistories[chatID] || [];
        chatHistory.push({
            role: "user",
            content: prompt,
            images: !imageBuffer ? [] : [imageBuffer.toString("base64")],
        });

        const botResponse = await this.chatWithMessages(chatHistory);
        chatHistory.push({ role: "assistant", content: botResponse });
        this.chatHistories[chatID] = chatHistory;
        return botResponse;
    }
    async singleStructuredPrompt(format, prompt, imageBuffer) {
        const messages = [{
            role: "user",
            content: prompt,
            images: !imageBuffer ? [] : [imageBuffer.toString("base64")],
        }];
        return this.chatWithMessages(messages, format);
    }
    /**
     * Prompt for a specific chatID
     * @param {string} chatID 
     * @param {string} prompt 
     * @param {Buffer} imageBuffer 
     * @returns {Promise<string>}
     */
    async chatStructuredPrompt(chatID, format, prompt, imageBuffer) {
        if (!(chatID in this.chatHistories)) {
            throw new Error("That chatbot does not exist");
        }

        const chatHistory = this.chatHistories[chatID] || [];
        chatHistory.push({
            role: "user",
            content: prompt,
            images: !imageBuffer ? [] : [imageBuffer.toString("base64")],
        });

        const botResponse = await this.chatWithMessages(chatHistory, format);
        chatHistory.push({ role: "assistant", content: botResponse });
        this.chatHistories[chatID] = chatHistory;
        return botResponse;
    }

    exportAll() {
        const allChats = {};
        const chatIDs = Object.keys(this.chatHistories);
        for (const chatID of chatIDs) {
            allChats[chatID] = this.chatHistories[chatID];
        }
        return allChats;
    }

    /**
     * @param {object} importedChats 
     * @param {"overwrite"|"merge"} merge 
     */
    importAll(importedChats, merge) {
        const mergeOption = merge.toLowerCase();
        if (typeof importedChats === 'object' && importedChats !== null) {
            if (mergeOption === 'overwrite') {
                this.chatHistories = importedChats;
            } else if (mergeOption === 'merge') {
                const importedChatIDs = Object.keys(importedChats);
                for (const chatID of importedChatIDs) {
                    this.chatHistories[chatID] = importedChats[chatID];
                }
            } else {
                throw new Error('Invalid merge option. Expected "overwrite" or "merge".');
            }
        } else {
            throw new Error('Invalid JSON format. Expected an object.');
        }
    }

}

module.exports = OllamaClient;