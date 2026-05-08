const discord = require("discord.js");
const CommandUtility = require("../../util/utility.js");

const configuration = require("../../config.js");
const env = require("../../util/env-util.js");

const isInTestMode = process.argv[2] === 'test';

const OllamaClients = require("../../util/ollama-clients.js");

const SchemaPunCheck = require('../../resources/schemas/pun-check.json');
const Brainrots = require("../../resources/brainrots.json");

class BotEvent {
    constructor(client) {
        this.listener = "messageCreate";
        this.once = false;

        this.client = client;
    }

    /**
     * @param {discord.Client} client 
     * @param {*} state 
     * @param {discord.Message} message 
     * @returns 
     */
    async invoke(client, state, message) {
        // see if this feature is enabled
        if (!env.getBool("OLLAMA_ENABLED")) return;
        if (!configuration.funkyCapabilities.ollamaClients.messageRewriter) return;

        // ignore bots
        if (!message.author) return;
        if (message.author.bot) return;
        if (message.author.system) return;
        if (message.system) return;

        const isTestingInPublic = isInTestMode && !(env.getBool("CHECK_FOR_DEFAULT_TEST_SERVERS") && message.guildId === "746156168560508950")

        // ignore #spam
        if (
            message.channel.id === configuration.channels.spam
            || (message.channel.parent && message.channel.parent.id === configuration.channels.spam)
        ) return;

        // BRAINRrot
        if (false && message.channel.id === configuration.channels.funkyBrainrot) {
            const mention = message.mentions.users.first();
            if (mention) {
                message.reply(`<@${message.author.id}> dont ping people or you'll cause ghost pings & get muted <:bfdi:1274604457979674737>`);
                message.delete();
                return;
            }

            if (message.attachments.size > 0) return message.delete();
            if (message.content.length <= 1) return message.delete();
            if (message.content.length > 512) return message.delete();
            // ascii only
            if (message.content.match(/[^\x00-\x7F]/g)) return message.delete();

            // start asking chattus geepitus
            const chatId = `aibrainrotcheck-${Math.random()}`;
            OllamaClients.messageRewriter.createChat(chatId);
            OllamaClients.messageRewriter.informChat(chatId,
                `You are a pun checker.`
                + `\n` + `Return true if the message is a good pun of any of the following character's names:`
                + `\n` + Brainrots.join(", ")
            );

            // get the response & reset the chat
            let response = "";
            try {
                const userMessageInput = `Is this a good pun of one of those names: ${message.content}`;
                const output = await OllamaClients.messageRewriter.chatStructuredPrompt(chatId, SchemaPunCheck, userMessageInput);
                response = output.content;
            } catch (err) {
                return message.delete();
            } finally {
                OllamaClients.messageRewriter.removeChat(chatId);
            }

            // we need to parse this response
            try {
                const parsed = JSON.parse(response);
                if (parsed.pun !== true) message.delete();
            } catch (err) {
                message.delete();
                throw err;
            }
            return;
        }
    }
}

module.exports = BotEvent;