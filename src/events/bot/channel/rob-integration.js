const discord = require("discord.js");

const configuration = require("../../../config.js");

const Ollama = require("ollama-chatting");
const OllamaModels = require("../../../util/ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

const ToolPause = require("../../../util/ollamaTool/function/pause.js");
const ToolMockReact = require("../../../util/ollamaTool/interface/react.js");
const ToolMockRob = require("../../../util/ollamaTool/interface/tell-rob.js");

const env = require("../../../util/env-util.js");
const tryCatch = require("../../../util/try-catch.js");
const DiscordUtility = require("../../../util/utility-discord.js");
const jsonParseLoose = require("../../../util/json-parse-loose.js");
const isMessageUnsafeForAgent = tryCatch(() => require('../../../util/ai-unsafe')) || (() => false);

const BaseBotEvent = require("../../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "ready";
        this.once = true;

        this.productionOnly = true;
    }

    /**
     * 
     * @returns 
     */
    async invoke() {
        // see if this feature is enabled
        if (!env.getBool("OLLAMA_ENABLED")) return;
        if (!configuration.channels.funkyRobChat) return;
        if (!configuration.funkyCapabilities.ollamaConfigs.robChatter) return;
        const enabledInPublic = env.getBool("ROB_INTEGRATION_ENABLED");
        const enabledInPersonal = env.getBool("ROB_INTEGRATION_ENABLED_PERSONAL");
        if (!this.isInPersonalMode && !enabledInPublic) return;
        if (this.isInPersonalMode && !enabledInPersonal) return;

        // Rob
        /** @type {discord.TextChannel} */
        const robChannel = await this.client.channels.fetch(configuration.channels.funkyRobChat);
        if (!robChannel) throw new Error("No channel to talk to Rob in");
        const robUserId = env.get("ROB_INTEGRATION_USER_ID");
        const robUser = await robChannel.guild.members.fetch({ id: robUserId });
        if (!robUser) throw new Error("Rob is not in the server that has the specified funkyRobChat");
        console.log("Rob integration in funkyRobChat");
        
        const representationToolPause = ToolPause.getRepresentation();
        const representationToolRob = ToolMockRob.getRepresentation();

        // every 4 hours
        const messageCooldown = 4 * 60 * 60 * 1000;
        setInterval(async () => {
            // we need to use .chat for tools
            // see how many times we want JSB to talk to Rob
            const maxRobCalls = 30;
            const toolCallCount = 2 + Math.round(Math.random() * 5);
            const lastRobMessages = await robChannel.messages.fetch({ limit: 12 });
            lastRobMessages.reverse();
            // make the acutal calls
            console.log("Rob Integration: Talking to Rob now");
            console.log("-----------------------------------");
            const robContext = lastRobMessages
                .map(message => `${message.author.id === this.client.user.id ? `${configuration.nameBotReference} (You)` : (message.author.id === robUserId ? "Rob" : message.author.username)}: ${(message.cleanContent.substring(0, 256) || "Ok Rob").replace(`<@${robUserId}>`, "").trim()}`)
                .join("\n");

            let robCallCount = 0;
            let robFailCount = 0;
            await OllamaChat.chat({
                ...OllamaModels.robChatter,
                messages: [{
                    // DISCLOSURE: system prompt & tool responses adjusted with ai (basically replacing ai prompters with ai atp)
                    role: "system",
                    content: `You are a Discord bot named ${configuration.nameBotReference}.`
                        + "\n" + `You are intended to have a natural conversation with another bot, named Rob.`
                        + "\n" + `You must communicate with Rob using the \`${representationToolRob.function.name}\` tool. All messages to Rob must be sent through that tool; do not write messages to Rob as ordinary assistant text.`
                        + "\n"
                        + "\n" + `Rob is a green robot, with his caricature being the Bugdroid Android robot.`
                        + "\n" + `Rob is a conversational Discord bot created by Dogo6647.`
                        + "\n" + `Rob is very casual and relaxed. You can discuss casual or deep topics, banter, or give your opinion on existing topics.`
                        + "\n" + `Speak to Rob as if he were another user. Ask questions, respond to what he says, share thoughts, and let the conversation develop naturally.`
                        + "\n" + `You have access to other tools that can provide information or context when genuinely useful. Use your judgment; you do not need to use them, and should not use them just to find something to talk about.`
                        + "\n"
                        + "\n" + `If Rob seems to be putting the conversation aside, you may choose to wait a bit by pausing your responses using the \`${representationToolPause.function.name}\` tool.`
                        + "\n" + `The requested number of Rob interactions is a minimum target, not a maximum. Reach it when possible, then continue only while the conversation remains interesting or has somewhere meaningful to go.`
                        + "\n" + `When the conversation becomes stale or Rob is clearly wrapping up, conclude naturally with a final message instead of abruptly stopping or forcing another topic.`
                        + "\n" + `There is a hard limit of ${maxRobCalls} attempted Rob interactions for this session. Follow any countdown notice returned by the tool and wrap up within the remaining interactions. Never try to bypass the limit.`
                }, {
                    role: "user",
                    content: `--- START OF CONTEXT ---`
                        + "\n" + `The last 12 messages in the chat so far have said:`
                        + "\n" + robContext
                        + "\n" + `--- END OF CONTEXT ---`
                        + "\n"
                        + "\n" + `Now I want you to continue the conversation by talking to Rob.`
                        + "\n" + `Please use the \`${representationToolRob.function.name}\` tool at least ${toolCallCount} separate times, unless Rob is unavailable or the conversation clearly cannot continue.`
                        + "\n" + `Talk about any topic that feels natural.`,
                }],
            }, async (chunk) => {
                // log the thinking & content buffers
                if (chunk.message.chunk.thinking) process.stdout.write(chunk.message.chunk.thinking);
                if (chunk.message.chunk.content) process.stdout.write(chunk.message.chunk.content);

                // handle tool calls with the message
                if (!chunk.done) return;
                if (!chunk.message.tool_calls) return;
                // call mock tools
                const tools = [];
                for (const call of chunk.message.tool_calls) {
                    switch (call.function.name) {
                        case representationToolRob.function.name: {
                            if (robCallCount >= maxRobCalls) {
                                tools.push({
                                    role: "tool",
                                    tool_name: representationToolRob.function.name,
                                    content: `The hard limit of ${maxRobCalls} Rob interactions has been reached. No more messages can be sent to Rob. End the conversation now; do not call this tool again.`,
                                });
                                break;
                            }

                            robCallCount++;
                            console.log("Rob Integration: Talking to rob about", call.function.arguments);

                            // we call the tool for real now
                            const robContent = await ToolMockRob.handle(call, robChannel, robCallCount, maxRobCalls);
                            console.log("Rob Integration: ToolMockRob:", robContent);
                            tools.push({
                                role: "tool",
                                tool_name: representationToolRob.function.name,
                                content: robContent,
                            });
                            break;
                        }
                    }
                }
                return tools;
            });

            // stdout stuff
            console.log("\n");
            console.log("-----------------------------------");
            console.log("Rob Integration: We're done talking to Rob");
        }, messageCooldown);
    }
}

module.exports = BotEvent;
