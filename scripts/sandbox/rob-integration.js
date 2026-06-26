// node scripts/sandbox/rob-integration.js
const configuration = require("../../src/config.js");
const env = require("../../src/util/env-util.js");

const Ollama = require("ollama-chatting");
const OllamaModels = require("../../src/util/ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

const ToolPause = require("../../src/util/ollamaTool/function/pause.js");
const ToolMockReact = require("../../src/util/ollamaTool/interface/react.js");
const ToolMockRob = require("../../src/util/ollamaTool/interface/tell-rob.js");

(async () => {
    const representationToolPause = ToolPause.getRepresentation();
    const representationToolRob = ToolMockRob.getRepresentation();

    // we need to use .chat for tools
    // see how many times we want JSB to talk to Rob
    const toolCallCount = 2 + Math.round(Math.random() * 5);
    console.log("toolCallCount", toolCallCount);
    // make the acutal calls
    console.log("Rob Integration: Talking to Rob now");
    console.log("-----------------------------------");
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
                + "\n" + `crazed_manc: <@1344543448719429673> What are you doing`
                + "\n" + `Rob: games :3`
                + "\n" + `Arcane: you playing or what`
                + "\n" + `Rob: nm :D`
                + "\n" + `Fac illud orationem: <@1344543448719429673> you wnan. Play some games lpater or smth`
                + "\n" + `Rob: maybe`
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
                    const responses = [
                        "no :D",
                        "idk :P",
                        "what",
                        "hold on",
                        "yes",
                        "no",
                        "lemme look that up",
                        "shut up :D"
                    ];
                    const response = responses[Math.round(Math.random() * (responses.length - 1))];
                    const toolContent = `Rob thought for ${(Math.random() + 0.5).toFixed(2)} seconds, and said: "${response}"`;
                    console.log("Rob Integration: emulating response;", toolContent);
                    tools.push({
                        role: "tool",
                        tool_name: representationToolRob.function.name,
                        content: toolContent,
                    });
                    break;
            }
        }
        return tools;
    });
})();