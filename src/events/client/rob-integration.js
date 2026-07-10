const discord = require("discord.js");
const CommandUtility = require("../../util/utility.js");

const configuration = require("../../config.js");
const env = require("../../util/env-util.js");

const Ollama = require("ollama-chatting");
const OllamaModels = require("../../util/ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

const ToolPause = require("../../util/ollamaTool/function/pause.js");
const ToolMockReact = require("../../util/ollamaTool/interface/react.js");
const ToolMockRob = require("../../util/ollamaTool/interface/tell-rob.js");

const tryCatch = require("../../util/try-catch.js");
const jsonParseLoose = require("../../util/json-parse-loose.js");
const isMessageUnsafeForAgent = tryCatch(() => require('../../util/ai-unsafe')) || (() => false);

class BotEvent {
    constructor(client) {
        this.listener = "ready";
        this.once = true;

        this.client = client;

        this.productionOnly = true;
    }

    /**
     * 
     * @param {discord.Client} client 
     * @param {*} state 
     * @returns 
     */
    async invoke(client, state) {
        // see if this feature is enabled
        if (!env.getBool("OLLAMA_ENABLED")) return;
        if (!configuration.funkyCapabilities.ollamaConfigs.robChatter) return;
        const isInPersonalMode = state.isInPersonalMode;
        const enabledInPublic = env.getBool("ROB_INTEGRATION_ENABLED");
        const enabledInPersonal = env.getBool("ROB_INTEGRATION_ENABLED_PERSONAL");
        if (!isInPersonalMode && !enabledInPublic) return;
        if (isInPersonalMode && !enabledInPersonal) return;

        // Rob
        /** @type {discord.TextChannel} */
        const robChannel = await client.channels.fetch(configuration.channels.funkyRobChat);
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
            const toolCallCount = 2 + Math.round(Math.random() * 5);
            const lastRobMessages = await robChannel.messages.fetch({ limit: 6 });
            lastRobMessages.reverse();
            // make the acutal calls
            console.log("Rob Integration: Talking to Rob now");
            console.log("-----------------------------------");
            const robContext = lastRobMessages
                .map(message => `${message.author.id === client.user.id ? `${configuration.nameBotReference} (You)` : (message.author.id === robUserId ? "Rob" : message.author.username)}: ${(message.cleanContent.substring(0, 256) || "Ok Rob").replace(`<@${robUserId}>`, "").trim()}`)
                .join("\n");
            await OllamaChat.chat({
                ...OllamaModels.robChatter,
                messages: [{
                    role: "system",
                    content: `You are a Discord bot named ${configuration.nameBotReference}.`
                        + "\n" + `You are intended to discuss with another bot, named Rob.`
                        + "\n" + `You must talk with Rob using the \`${representationToolRob.function.name}\` tool. Create a structured JSON tool call to use it.`
                        + "\n" + `All messaging will be processed strictly through the \`${representationToolRob.function.name}\` tool only. You must send proper JSON tool calls with your message.`
                        + "\n"
                        + "\n" + `Rob is a green robot, with his caricature being the Bugdroid Android robot.`
                        + "\n" + `Rob is a conversational Discord bot created by Dogo6647.`
                        + "\n" + `Rob is very casual and relaxed. You can choose to ask them casual, relaxed questions, or deep, thoughtful questions. Either type is fine.`
                        + "\n" + `You can also choose to discuss banter or give your opinion on existing topics instead.`
                        + "\n" + `You may use any other tools provided to you as a topic starter if the conversation seems dry.`
                        + "\n"
                        + "\n" + `Speak to Rob as if they were another user. You are allowed to ask questions, get context, mention topics, and speak casually.`
                        + "\n" + `If Rob seems to be putting the conversation aside, you may choose to wait a bit by pausing your responses using the \`${representationToolPause.function.name}\` tool.`
                }, {
                    role: "user",
                    content: `--- START OF CONTEXT ---`
                        + "\n" + `The last 6 messages in the chat so far have said:`
                        + "\n" + robContext
                        + "\n" + `--- END OF CONTEXT ---`
                        + "\n"
                        + "\n" + `Now I want you to continue the conversation by talking to Rob.`
                        + "\n" + `Please use the \`${representationToolRob.function.name}\` tool ${toolCallCount} separate times.`
                        + "\n" + `Talk to him about any topic.`,
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
                        case representationToolRob.function.name:
                            console.log("Rob Integration: Talking to rob about", call.function.arguments);
                            tools.push({
                                role: "tool",
                                tool_name: representationToolRob.function.name,
                                content: await ToolMockRob.handle(robChannel, call),
                            });
                            break;
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