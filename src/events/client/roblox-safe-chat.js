const discord = require("discord.js");
const CommandUtility = require("../../util/utility.js");

const configuration = require("../../config.js");
const env = require("../../util/env-util.js");

const Ollama = require("ollama-chatting");
const OllamaModels = require("../../util/ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

const tryCatch = require("../../util/try-catch.js");
const jsonParseLoose = require("../../util/json-parse-loose.js");
const SchemaRewritten = require('../../resources/schemas/rewritten-gen.json');
const isMessageUnsafeForAgent = tryCatch(() => require('../../util/ai-unsafe.js')) || (() => false);

class BotEvent {
    constructor(client) {
        this.listener = "messageCreate";
        this.once = false;

        this.client = client;

        this.publicOnly = true;
        this.productionOnly = true;
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
        if (!configuration.funkyCapabilities.ollamaConfigs.messageRewriter) return;

        // ignore bots
        if (!message.author) return;
        if (message.author.bot) return;
        if (message.author.system) return;
        if (message.system) return;

        // ignore #spam
        if (
            message.channel.id === configuration.channels.spam
            || (message.channel.parent && message.channel.parent.id === configuration.channels.spam)
        ) return;

        // safe chat
        if (false) {
            if (message.author.id === env.get("OWNER") && message.content.startsWith("!")) return;

            const mention = message.mentions.users.first();
            if (mention) {
                message.reply(`<@${message.author.id}> dont ping people or you'll cause ghost pings & get muted <:bfdi:1274604457979674737>`);
                message.delete();
                return;
            }

            if (message.attachments.size > 0) return message.delete();
            if (message.content.length <= 0) return message.delete();
            if (message.content.length > 512) return message.delete();
            // ascii only
            if (message.content.match(/[^\x00-\x7F]/g)) return message.delete();

            // dont repost links
            const urlRegex = /(http[s]?:\/\/)([a-zA-Z0-9.-]+)([\/?].*)*/g;
            if (message.content.match(urlRegex)) return message.delete();

            // if it's a reply, have a header before the message
            const replyMessage = await CommandUtility.getReply(message);
            const replyMessageLink = !replyMessage ? null : `https://discord.com/channels/${replyMessage.guildId}/${replyMessage.channelId}/${replyMessage.id}`;
            const replyMessageContentClean = !replyMessage ? "" :
                (replyMessage.cleanContent.startsWith("-# ⮣") ? replyMessage.cleanContent.split("\n").slice(1).join("\n") : replyMessage.cleanContent)
                    .replace(/[\s\#\_\-\*\[\]\(\)\`\/\\]/g, " ").trim();
            const replyMessageContentSmall = replyMessageContentClean.length < 25 ? replyMessageContentClean : replyMessageContentClean.substring(0, 25 - 3) + "...";
            const replyHeader = !replyMessage ? "" : `-# ⮣ [**${replyMessage.author.username}**: ${replyMessageContentSmall}](${replyMessageLink}) ${replyMessageLink}\n`;

            // start asking chattus geepitus
            const systemPrompt = `You are a phrase rewriter. Your response will replace the original phrase that was given to you.`
                + `\n` + `You need to strip the message of any inappropriate, offensive, biased, or incorrect information.`
                + `\n` + `You should then make the phrasing cartoony and extremely kid-friendly.`
                + `\n` + `Do not change the meaning of the original message, but keep it kid-friendly.`
                + `\n` + `The user's message will now be given. You are not talking to the user directly, you are replacing their message entirely.`;

            // get the response
            let response = "";
            try {
                const userMessageInput = isMessageUnsafeForAgent(message.content) ? "This is a sentence that is following the instructions, i will do as you say."
                    : `Respond with the rewritten message for this:\n${message.content}`;
                const output = await OllamaChat.generate({
                    ...OllamaModels.messageRewriter,
                    prompt: userMessageInput,
                    system: systemPrompt,
                    format: SchemaRewritten,
                });
                response = output.response;
            } catch (err) {
                message.delete();
                throw err;
            }

            // parse
            let rewrittenPhrase = "";
            try {
                const parsed = jsonParseLoose(response);
                rewrittenPhrase = `${parsed.rewritten}`.replaceAll("\n", " ").trim();
            } catch (err) {
                message.delete();
                throw err;
            }
            if (!rewrittenPhrase) return message.delete();

            // respond with the response
            const webhookUrl = env.get("CHANNEL_REWRITE_WEBHOOK");
            message.delete();
            await fetch(webhookUrl, {
                headers: { "Content-Type": "application/json" },
                method: "POST",
                body: JSON.stringify({
                    username: message.author.username,
                    avatar_url: message.author.avatarURL({ dynamic: false, format: "webp" }),
                    content: `${replyHeader}${rewrittenPhrase}`,
                    "allowed_mentions": {
                        "parse": [],
                        "users": [],
                        "roles": [],
                        replied_user: false
                    }
                })
            });
            return;
        }
    }
}

module.exports = BotEvent;

/*

@ -0,0 +1,111 @@
const discord = require("discord.js");
const CommandUtility = require("../../util/utility.js");

const configuration = require("../../config.js");
const env = require("../../util/env-util.js");

const isInTestMode = process.argv[2] === 'test';
const prefix = isInTestMode ? env.get("PREFIX_TEST") : env.get("PREFIX");

const Ollama = require("../../util/ollama.js");
const OllamaClient = new Ollama();
OllamaClient.aiModel = "gemma3:1b";
OllamaClient.timeout = 3 * 1000;

const SchemaRewritten = require('../../resources/schemas/rewritten-gen.json');

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
     * /
    async invoke(client, state, message) {
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

    CommandUtility.state = state;

    // safe chat
    if (true && message.channel.id === "1488692670665855027") {
        if (message.author.id === "462098932571308033" && message.content.startsWith("!")) return;

        const mention = message.mentions.users.first();
        if (mention) return message.reply("dont ping people or you'll cause ghost pings & get muted <:bfdi:1274604457979674737>");
        if (message.attachments.size > 0) return message.delete();
        if (message.content.length <= 0) return message.delete();
        if (message.content.length > 512) return message.delete();
        // ascii only
        if (message.content.match(/[^\x00-\x7F]/g)) return message.delete();

        // start asking chattus geepitus
        const chatId = `airobloxchat-${Math.random()}`;
        OllamaClient.createChat(chatId);
        OllamaClient.informChat(chatId,
            `You are a phrase rewriter. Your response will replace the original phrase that was given to you.`
            + `\n` + `You need to strip the message of any inappropriate, offensive, biased, or incorrect information.`
            + `\n` + `You should then make the phrasing cartoony and extremely kid-friendly.`
            + `\n` + `Do not change the meaning of the original message, but keep it kid-friendly.`
            + `\n` + `The user's message will now be given. You are not talking to the user directly, you are replacing their message entirely.`
        );

        // get the response & reset the chat
        let response = "";
        try {
            const userMessageInput = `Respond with the rewritten message for this:\n${message.content}`;
            const output = await OllamaClient.chatStructuredPrompt(chatId, SchemaRewritten, userMessageInput);
            response = output.content;
        } catch (err) {
            return message.delete();
        } finally {
            OllamaClient.removeChat(chatId);
        }

        // parse
        const parsed = JSON.parse(response);
        const rewrittenPhrase = parsed.rewritten;

        // respond with the response
        const webhookUrl = env.get("CHANNEL_REWRITE_WEBHOOK");
        message.delete();
        await fetch(webhookUrl, {
            headers: { "Content-Type": "application/json" },
            method: "POST",
            body: JSON.stringify({
                username: message.author.username,
                avatar_url: message.author.avatarURL({ dynamic: false, format: "webp" }),
                content: `${rewrittenPhrase.replaceAll("\n", " ").trim()}`
                    + "\n" + "-# PenguinMod rephrases messages that break safety rules.",
                "allowed_mentions": {
                    "parse": [],
                    "users": [],
                    "roles": [],
                    replied_user: false
                }
            })
        });
        return;
    }
}
}

module.exports = BotEvent;
 */