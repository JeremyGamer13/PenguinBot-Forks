const OllamaClients = require("../../util/ollama-clients");

const Database = require('sync-json-database');
const TrainingDatabase = new Database('./databases/train-ai.json');

const tryCatch = require("../../util/try-catch");
const isMessageUnsafeForAgent = tryCatch(() => require('../../util/ai-unsafe')) || (() => false);

// DISCLOSURE: these 2 functions are ai code
const createNgramIndex = (trainingData, n = 4) => {
    const trainingNgrams = new Set();

    trainingData.forEach(text => {
        // Normalize: lowercase and remove punctuation
        const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
        for (let i = 0; i <= words.length - n; i++) {
            trainingNgrams.add(words.slice(i, i + n).join(' '));
        }
    });

    return trainingNgrams;
}
/**
 * Checks for matches against the precomputed index.
 */
const checkOverfitting = (ngramIndex, aiString, n = 4) => {
    const aiWords = aiString.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);

    for (let i = 0; i <= aiWords.length - n; i++) {
        const sequence = aiWords.slice(i, i + n).join(' ');
        if (ngramIndex.has(sequence)) {
            return true;
        }
    }
    return false;
}

class Command {
    constructor() {
        this.name = "pmgpt";
        this.description = "Speak with the great penguinmod server AI";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
            jgOllamaClientsInvolved: ["penguinGPT"],
        };

        this.alias = ["penguingpt", "pmai", "penguinai", "penguinmodgpt", "penguinmodai"];
        this.processing = false;

        // presetup the dataset to check for overfitting
        const datasetRawMessages = TrainingDatabase.array("keys")
            .filter(key => key.startsWith("m-"))
            .map(key => TrainingDatabase.get(key))
            .flat(Infinity);
        const datasetAuthors = TrainingDatabase.array("keys")
            .filter(key => key.startsWith("a-"))
            .map(key => TrainingDatabase.get(key).toLowerCase());
        this.datasetAuthors = datasetAuthors;
        this.ngramLoose = { index: createNgramIndex(datasetRawMessages, 8), n: 8 };
        this.ngramStrict = { index: createNgramIndex(datasetRawMessages, 3), n: 3 };
    }

    isResponseOverfitting(response) {
        // be more sensitive if the response also contains a username
        const responses = response.split("\n");
        for (const response of responses) {
            const colonChar = response.indexOf(":");
            const username = colonChar === -1 ? "" : response.slice(0, colonChar);
            if (username && this.datasetAuthors.includes(username.toLowerCase())) {
                const overfitting = checkOverfitting(this.ngramStrict.index, response, this.ngramStrict.n);
                if (overfitting) return true;
            }

            const overfitting = checkOverfitting(this.ngramLoose.index, response, this.ngramLoose.n);
            if (overfitting) return true;
        }

        return false;
    }
    cleanResponse(response) {
        const trimmed = response.replace(/\r/g, "").substring(0, 2000).trim();
        const newlineCount = trimmed.split("\n").length - 1;
        const likelyResponse = (newlineCount <= 3 ? trimmed : trimmed.split("\n").shift()).trim();
        const noQuoteStart = (likelyResponse.startsWith('"') ? likelyResponse.slice(1) : likelyResponse);
        const noQuotes = (noQuoteStart.endsWith('"') ? noQuoteStart.slice(0, -1) : noQuoteStart);

        // return *(no response)* if blank by this point
        if (noQuotes === "") return "*(no response)*";

        // detect overfitting
        const likelyOverfitting = this.isResponseOverfitting(noQuotes);
        const overfittingWarning = "\n-# This response is likely regurgitating from the dataset. (overfitting)";
        return !likelyOverfitting ? noQuotes : (noQuotes.substring(0, 1995 - overfittingWarning.length) + overfittingWarning);
    }
    async invoke(message, args, util) {
        const canDo = util.request("heavyExternalStuff");
        if (!canDo) return message.reply("❌ disabled (im probably playing a game)");
        if (this.processing) return message.reply("❌ he's fucking BUSY replying to someone else bud");
        
        // start asking chattus geepitus
        this.processing = true;

        const chatId = `aipenguingpt-${Math.random()}`;
        OllamaClients.penguinGPT.createChat(chatId);

        const userMessage = args.join(" ");
        const userMessageUnderstood = (isMessageUnsafeForAgent(userMessage) ? "Shut the fuck up Fuck you i hjate you i hate you fuck you 😁"
            : userMessage) + "\nMake sure to respond like an idiot according to the training data"
            + "\nPlease respond in two sentences or less please";

        // get the response & reset the chat
        let response = "";
        try {
            await message.channel.sendTyping();
            const output = await OllamaClients.penguinGPT.chatPrompt(chatId, userMessageUnderstood);
            console.log(output);
            response = this.cleanResponse(output.content);
        } catch (err) {
            return message.reply("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        } finally {
            OllamaClients.penguinGPT.removeChat(chatId);
            this.processing = false;
        }

        if (!util.automodAllows(response)) {
            console.log(`tried to post automodded response from pmgpt by ${message.author.id} at ${util.makeMessageLink(message)}\n---\n${response}\n---`);
            return message.reply({
                content: `*(This can't be posted because it contains content blocked by this server.)*`
                    + "\n" + `-# Triggered by <@${message.author.id}>`,
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        }
        message.reply({
            content: response,
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;