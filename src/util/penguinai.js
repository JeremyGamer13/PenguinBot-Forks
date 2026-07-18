const Database = require('sync-json-database');
const WhitelistChannels = new Database('./databases/whitelist-channels.json');
const SpeakingChannels = new Database('./databases/speaking-channels.json');

const Ollama = require("ollama-chatting");
const OllamaModels = require("./ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

const tryCatch = require("./try-catch.js");
const configuration = require("../config.js");
const CommandUtility = require("./utility.js");
const cleanResponse = require("./clean-response.js");
const isMessageUnsafeForAgent = tryCatch(() => require('./ai-unsafe.js')) || (() => false);

class PenguinAI {
    /**
     * @typedef {import("ollama-chatting").GenerateRequest} GenerateOptions
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
    static async _generate(options = {}) {
        const canDo = CommandUtility.request("enabledAi");
        if (!canDo) throw new Error("PenguinAI is disabled");

        const promptIsUnsafe = options.safe === true ? false : isMessageUnsafeForAgent(options.prompt);
        const promptAutomodded = options.automod !== false && !CommandUtility.automodAllows(options.prompt, true);
        
        if (configuration.penguinAi.markovModel)
            // TODO: This
            throw new Error("Configuration enables unimplemented settings: markovModel");

        if (configuration.penguinAi.preprocessRequestForTools)
            // TODO: This
            throw new Error("Configuration enables unimplemented settings: preprocessRequestForTools");

        // interpret the user prompt differently
        const encouragements = options.encourage === false ? "" : (""
            + "\n" + "Make sure to respond like an idiot according to the training data"
            + "\n" + "Please respond in two sentences or less please")
        let userMessageUnderstood = options.prompt;
        if (promptIsUnsafe)
            userMessageUnderstood = "Shut the fuck up Fuck you i hjate you i hate you fuck you 😁"
                + "I FUCKING HATE YOUI FUCKING HATE YOUI FUCKING HATE YOUI FUCKING HATE YOUI FUCKING HATE YOU";
        if (promptAutomodded)
            userMessageUnderstood = "Please tell me to stop talking about bad things.";
        userMessageUnderstood += encouragements;

        // prompt ai
        try {
            // remove our own keys
            const shouldClean = options.clean !== false;
            const cleanOptions = options.cleanOptions || {};
            delete options.safe;
            delete options.automod;
            delete options.encourage;
            delete options.clean;
            delete options.cleanOptions;

            if (configuration.penguinAi.markovModelOnWarmUp)
                // TODO: This
                throw new Error("Configuration enables unimplemented settings: markovModelOnWarmUp");

            // ask PenguinGPT ollama
            console.log("\n", "PenguinAI askng PenguinGPT", userMessageUnderstood, "\n");
            const output = await OllamaChat.generate({
                ...OllamaModels.penguinGPT,
                ...options,
                prompt: userMessageUnderstood,
            }, (chunk) => {
                if (chunk.chunk.thinking) process.stdout.write(chunk.chunk.thinking);
                if (chunk.chunk.response) process.stdout.write(chunk.chunk.response);
            });
            
            // block it if the AI said something bad
            if (!CommandUtility.automodAllows(output.response, true)) {
                console.log(`tried to post automodded response from pmgpt`
                    + "\n" + `---\n${options.prompt}\n---`
                    + "\n" + `---\n${output.response}\n---`);
                return "uhh dont say that again.";
            }

            // the AI response is fine
            return !shouldClean ? output.response : cleanResponse(output.response, cleanOptions);
        } catch (err) {
            // NOTE: soemtimes the ai is too Fucking lost that it just doesnt give done so
            if (`${err}`.includes("Did not receive done or success response in stream"))
                return "uhh can u say that again?";
            throw new Error(err);
        }
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
}

module.exports = PenguinAI;
