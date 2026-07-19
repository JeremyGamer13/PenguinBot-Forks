const Database = require('sync-json-database');
const WhitelistChannels = new Database('./databases/whitelist-channels.json');
const SpeakingChannels = new Database('./databases/speaking-channels.json');

// things needed for ollama
const Ollama = require("ollama-chatting");
const OllamaModels = require("./ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

const env = require("./env-util.js");
const tryCatch = require("./try-catch.js");
const configuration = require("../config.js");
const CommandUtility = require("./utility.js");
const cleanResponse = require("./clean-response.js");
const isMessageUnsafeForAgent = tryCatch(() => require('./ai-unsafe.js')) || (() => false);

// things needed by markov model
const { default: Markov } = require('markov-strings');
const markovData = require("../resources/markov-data.json"); // TODO: tryCatch this
const markov = new Markov({ stateSize: 2 });
markov.addData(markovData.content);

const nouns = require("../resources/nouns.json");

// DISCLOSURE: Regex stuffs by ai but like these can probably be found online easily
const regexDiscordEmoji = /<a?:\w+:\d+>/g;
const regexNumbers = /\d+/g;
const regexEmojis = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
const regexPotentialNouns = /\b[a-zA-Z]{4,}\b/g;

const delay = (ms) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};

class PenguinAI {
    /**
     * @typedef {object} GenerateOptions
     * @property {string} prompt A prompt to generate from
     * @property {string?} system A system prompt to instruct the AI
     * @property {boolean?} markov If true, always use the markov model regardless of config
     * @property {boolean?} safe If true, we dont block this request from the AI even if it's against AI unsafe. Default is false
     * @property {boolean?} automod If false, we dont block this request from the AI even if it's against server automod. Default is true
     * @property {boolean?} encourage If false, we dont append our own encouragements to the AI. Default is true
     * @property {boolean?} clean If true, Use cleanResponse on the response. Default is true
     * @property {object?} cleanOptions See cleanResponse - CleanResponseOptions
     */
    /**
     * @private
     * @param {GenerateOptions?} options 
     * @returns {Promise<string>}
     */
    static _generate(options = {}) {
        const canDo = CommandUtility.request("enabledAi");
        if (canDo === false) throw new Error("PenguinAI is disabled");

        const usingMarkov = options.markov || !!CommandUtility.request("enabledMarkov");
        const promptIsUnsafe = options.safe === true ? false : isMessageUnsafeForAgent(options.prompt);
        const promptAutomodded = options.automod !== false && !CommandUtility.automodAllows(options.prompt, true);
        if (usingMarkov && options.system)
            throw new Error("Cannot use a system prompt when the markov model is in use");
        if (!usingMarkov && !env.getBool("OLLAMA_ENABLED"))
            throw new Error("Ollama is disabled");

        // use this message for markov (we dont need to encourage markov model to do anything because,,,, what would it change)
        let userMessageUnderstood = options.prompt;
        if (promptIsUnsafe)
            userMessageUnderstood = "Shut the fuck up Fuck you i hjate you i hate you fuck you 😁"
                + "I FUCKING HATE YOUI FUCKING HATE YOUI FUCKING HATE YOUI FUCKING HATE YOUI FUCKING HATE YOU";
        if (promptAutomodded)
            userMessageUnderstood = "Please tell me to stop talking about bad things.";

        // use this message for ollama/ai
        let userMessageForAI = userMessageUnderstood;
        if (!usingMarkov) {
            if (configuration.penguinAi.preprocessRequestForTools)
                // TODO: This
                throw new Error("Configuration enables unimplemented settings: preprocessRequestForTools");

            // interpret the user prompt differently
            const encouragements = options.encourage === false ? "" : (""
                + "\n" + "Make sure to respond like an idiot according to the training data"
                + "\n" + "Please respond in two sentences or less please")
            userMessageForAI += encouragements;
        }

        // prompt ai
        return new Promise(async (resolve, reject) => {
            try {
                // this code is structured for markovModelOnLongWait but it should handle markov, markov on wait, and ollama
                let alreadyCompleted = false;
                const ollamaRequest = async () => {
                    try {
                        // ask penguinAI ollama
                        // NOTE: It's actually important that we dont end this request too early if it's a warmup request,
                        // because ollama might think it's appropriate to deload PenguinGPT since the loading request got interrupted.
                        // We actually DONT want this behavior because PenguinGPT takes a while to load, and having him spout text into a void
                        // is better than never giving him enough time or requests to load for the first time.
                        console.log("\n", "PenguinAI bot askng penguinAI model", userMessageForAI, "\n");
                        const output = await OllamaChat.generate({
                            ...OllamaModels.penguinAI,
                            prompt: userMessageForAI,
                            system: options.system,
                        }, (chunk) => {
                            if (chunk.chunk.thinking) process.stdout.write(chunk.chunk.thinking);
                            if (chunk.chunk.response) process.stdout.write(chunk.chunk.response);
                        });

                        return output.response;
                    } catch (err) {
                        // Ignore ollama errors if we already got overtaken by markov model
                        if (alreadyCompleted) return;
                        throw err;
                    }
                };
                const markovRequest = () => {
                    return new Promise(async (resolve, reject) => {
                        setTimeout(async () => {
                            if (alreadyCompleted) return resolve();

                            // ask penguinAI markov
                            try {
                                console.log("\n", "PenguinAI markov falling back; looking for keywords in", userMessageUnderstood, "\n");
                                const output = await this._generateMarkov(userMessageUnderstood);
                                return resolve(output);
                            } catch (err) {
                                // ignore markov errors if the ollama model finished in time
                                if (alreadyCompleted) return resolve();
                                reject(err);
                            }
                        }, usingMarkov ? 0 : 8000);
                    });
                };

                // Run both if necessaary and wait for a response
                const generatedResponse = await Promise.race([
                    ...(!usingMarkov ? [ollamaRequest()] : []),
                    ...((usingMarkov || configuration.penguinAi.markovModelOnLongWait) ? [markovRequest()] : []),
                ]);
                alreadyCompleted = true;
                if (typeof generatedResponse !== "string") {
                    throw new Error("No proper response from Ollama or Markov model");
                }

                // block it if the AI said something bad
                const blockedWord = CommandUtility.automodAllows(generatedResponse, true, true);
                if (blockedWord) {
                    console.log(`tried to post automodded response from pmai`
                        + "\n" + `---\n${options.prompt}\n---`
                        + "\n" + `---\n${generatedResponse}\n---`
                        + "\n" + `he said ${blockedWord}`
                        + "\n");
                    return resolve("uhh dont say that again.");
                }

                // the AI response is fine
                const finalResponse = options.clean === false ? generatedResponse : cleanResponse(generatedResponse, options.cleanOptions);
                resolve(finalResponse);
            } catch (err) {
                // NOTE: soemtimes the ai is too Fucking lost that it just doesnt give done so
                if (`${err}`.includes("Did not receive done or success response in stream")
                    || `${err}`.includes("Failed to build a sentence") // markov error
                    || `${err}`.includes("This operation was aborted")) {
                    console.warn(`Caught a known error in PenguinAI; ${err}`);
                    return resolve("uhh can u say that again?");
                }

                reject(err);
            }
        });
    }
    /** @private */
    static async _generateMarkov(inputText = "") {
        const maxTries = 3000;
        const keywords = this.extractKeywords(inputText.toLowerCase());
        console.log("PenguinAI Markov found these keywords;", keywords);

        const result = markov.generate({
            maxTries: maxTries,
            filter: (result) => {
                // i think anything past 200 chars is just too much garbage
                const str = result.string.toLowerCase();
                if (str.length > 200) return false;

                // DISCLOSURE: ai extended (this originally only looked for 1 keyword before maxTries/2)
                if (result.tries < maxTries / 2) {
                    // 2. Determine how many keywords are required based on tries
                    // 0-250: 4, 250-500: 3, 500-750: 2, 750-1000: 1
                    const segmentSize = (maxTries / 2) / keywords.length;
                    const requiredCount = keywords.length - Math.floor(result.tries / segmentSize);

                    // 3. Count how many keywords are present in the string
                    const foundCount = keywords.filter(k => str.includes(k)).length;

                    // 4. Return true only if we meet the dynamic requirement
                    return foundCount >= requiredCount;
                }

                // create permutations from the input and try to find them
                const permutationWords = inputText.toLowerCase()
                    .split(" ")
                    .map(word => word.slice(0, -Math.floor(Math.random() * word.length)))
                    .filter(word => !!word);
                return permutationWords.some(word => str.includes(word));
            }
        })

        const response = result.string;
        return response;
    }

    /** @private */
    static _queue = [];
    /** @private */
    static _queueProcessing = false;
    /** @private */
    static async _processQueue() {
        if (this._queueProcessing) return;
        this._queueProcessing = true;

        try {
            // DISCLOSURE: ai optimization
            while (this._queue.length > 0) {
                // Get the first item without creating a new array
                const callback = this._queue.shift();
                await callback();
            }
        } finally {
            this._queueProcessing = false;
        }
    }

    /**
     * The max length of the history list
     * @returns {4}
     */
    static get HISTORY_LENGTH() {
        return 4;
    }

    /**
     * Global message history of channel id -> message content[]
     * @type {Map<string, string[]>}
     */
    static history = new Map();

    /**
     * Whether or not PenguinAI is allowed to listen in this channel right now
     * @param {string} channelId 
     * @returns {boolean}
     */
    static canListenIn(channelId) {
        if (!CommandUtility.request('enabledAi')) return false;
        if (channelId === configuration.channels.spam) return false;
        if (channelId === configuration.channels.userReports) return false;
        if (channelId === configuration.channels.adminReports) return false;

        const channelSpecification = WhitelistChannels.get(channelId);
        const isDisabledInWhitelist = channelSpecification === false;
        if (isDisabledInWhitelist) return false;

        // if channelSpecification is truthy by this point, then it was configured to be usable
        return channelSpecification ? true : configuration.permissions.lockedToPenguinAI.includes(channelId);
    }
    /**
     * Whether or not PenguinAI is allowed to speak automatically in this channel right now
     * @param {string} channelId 
     * @returns {boolean}
     */
    static canSpeakIn(channelId) {
        if (!CommandUtility.request('enabledAi')) return false;
        if (channelId === configuration.channels.spam) return false;
        if (channelId === configuration.channels.userReports) return false;
        if (channelId === configuration.channels.adminReports) return false;
        return SpeakingChannels.get(channelId) === true;
    }

    /**
     * Whether or not PenguinAI is allowed to listen to the specified message (save it in limited history)
     * @param {string} content 
     * @returns {boolean}
     */
    static canListenTo(content) {
        if (!CommandUtility.request('enabledAi')) return false;
        return !isMessageUnsafeForAgent(content) && CommandUtility.automodAllows(content, true);
    }

    /**
     * Generate a response from PenguinAI according to a prompt.
     * @param {GenerateOptions?} options 
     * @returns {Promise<string>} The PenguinAI response
     */
    static generate(options) {
        // add to queue and resolve on return, reject on error
        return new Promise(async (resolve, reject) => {
            const callback = async () => {
                try {
                    resolve(await this._generate(options));
                } catch (err) {
                    reject(err);
                }
            };

            this._queue.push(callback);
            this._processQueue();
        });
    }
    /**
     * Gets likely keywords from a prompt. Used by the Markov implementation to make responses slightly coherent.
     * This counts emojis, numbers, known usernames, and nouns.
     * @param {string} prompt 
     * @returns {string[]} The keywords found
     */
    static extractKeywords(prompt = "") {
        // DISCLOSURE: this is mostly ai
        const matches = [
            ...(prompt.match(regexDiscordEmoji) || []),
            ...(prompt.match(regexNumbers) || []),
            ...(prompt.match(regexEmojis) || []),
            ...(prompt.match(regexPotentialNouns) || []),
            ...(prompt.toLowerCase().split(" ").filter(word => nouns.includes(word) || markovData.usernames.includes(word)))
        ];

        return [...new Set(matches)]; // Unique keywords
    }
}

module.exports = PenguinAI;
