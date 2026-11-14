const discord = require("discord.js");

const configuration = require("../../../config.js");

const Ollama = require("ollama-chatting");
const OllamaModels = require("../../../util/ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

const env = require("../../../util/env-util.js");
const tryCatch = require("../../../util/try-catch.js");
const DiscordUtility = require("../../../util/utility-discord.js");
const jsonParseLoose = require("../../../util/json-parse-loose.js");
const BotEventEmitter = require("../../../util/bot-event-emitter.js");
const SchemaRewritten = require('../../../resources/schemas/rewritten-gen.json');
const isMessageUnsafeForAgent = tryCatch(() => require('../../../util/ai-unsafe.js')) || (() => false);

const BaseBotEvent = require("../../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "userSentMessage";
        this.once = false;

        this.handler = BotEventEmitter;

        this.publicOnly = true;
        this.productionOnly = true;
    }

    /**
     * @param {discord.Message} message 
     * @returns 
     */
    async invoke(message) {
        // see if this feature is enabled
        if (!env.getBool("OLLAMA_ENABLED")) return;
        if (!configuration.funkyCapabilities.ollamaConfigs.messageRewriter) return;

        // safe chat
        if (true) return;
        if (!configuration.channels.funkyRobloxSafeChat) return;
        if (message.channel.id !== configuration.channels.funkyRobloxSafeChat) return;
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
        const replyMessage = await DiscordUtility.getReply(message);
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
        const webhookUrl = env.get("CHANNEL_REWRITE_ROBLOX_WEBHOOK");
        message.delete();
        await fetch(webhookUrl, {
            headers: { "Content-Type": "application/json" },
            method: "POST",
            body: JSON.stringify({
                username: message.author.username,
                avatar_url: message.author.avatarURL({ dynamic: false, format: "webp" }),
                content: `${replyHeader}${rewrittenPhrase}`
                    + "\n" + "-# PenguinMod rephrases messages that break safety rules.",
                "allowed_mentions": {
                    "parse": [],
                    "users": [],
                    "roles": [],
                    replied_user: false
                }
            })
        });
    }
}

module.exports = BotEvent;
