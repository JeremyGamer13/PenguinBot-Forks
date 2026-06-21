const OllamaModels = require("../../util/ollama-models");
const tryCatch = require("../../util/try-catch");

const AISharedChat = require("../../util/ai-chat");
const ToolMockReact = require("../../util/ollamaTool/interface/react.js");
const ToolMockRob = require("../../util/ollamaTool/interface/tell-rob.js");

const delay = (ms) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};

class Command {
    constructor() {
        this.name = "prompt";
        this.description = "tyea";
        this.attributes = {
            permission: 0,
            unlisted: true,
            jgAiChatCommand: true,
            jgOllamaClientsInvolved: ["mutatableChatbot"],
        };
    }

    async invoke(message, args, util) {
        // start asking chattus geepitus
        const role = args.shift();
        if (!['user', 'assistant', 'system'].includes(role)) throw new Error("Role must be 'user' 'assistant' 'system'");
        const chatId = args.shift();
        if (!chatId) throw new Error("Specify chat bro");
        /** @type {import("ollama-chatting")} */
        const ollamaChat = AISharedChat.chats[chatId];
        if (!ollamaChat) throw new Error("Bradar what is this Thats not a real chat");

        console.log(ollamaChat.history);
        if (role !== "user") {
            ollamaChat.history.push({
                role,
                content: args.join(" ") || "Keep going"
            });
            return message.reply("Done, ask with 'user' role to generate");
        }

        // get the response
        let lastEditTime = 0;
        const workingMessage = await message.reply({
            content: `*(starting up \`${OllamaModels.mutatableChatbot.model}\` if it isn't loaded already...)*`,
            "allowed_mentions": {
                "parse": [],
                "users": [],
                "roles": [],
                replied_user: false
            }
        });
        try {
            const response = await ollamaChat.chat({
                ...OllamaModels.mutatableChatbot,
                messages: [{
                    role,
                    content: args.join(" ") || "Hi",
                }],
            }, async (chunk) => {
                let contentToReturn = null;
                // handle tool calls with the message
                if (chunk.done && chunk.message.tool_calls) {
                    const tools = [];
                    for (const call of chunk.message.tool_calls) {
                        switch (call.function.name) {
                            case "react":
                                tools.push({
                                    role: "tool",
                                    tool_name: "react",
                                    content: await ToolMockReact.handle(message, call),
                                });
                                break;
                            case "tell-rob":
                                tools.push({
                                    role: "tool",
                                    tool_name: "tell-rob",
                                    content: await ToolMockRob.handle(message, call),
                                });
                                break;
                        }
                    }
                    contentToReturn = tools;
                }

                // handle discord updates
                const hasBeenLongEnough = (Date.now() - lastEditTime) > 1000;
                if (!hasBeenLongEnough) return contentToReturn;

                const messageContent = (chunk.message.content ? chunk.message.content : `*${(chunk.message.thinking || "Generating...")}*`)
                    .trim().substring(0, 2000);
                await workingMessage.edit({ content: messageContent || "???" });
                lastEditTime = Date.now();
                return contentToReturn;
            });
            // done generating
            while (!((Date.now() - lastEditTime) > 1000)) {
                await delay(1000);
            }

            const messageContent = (response.message.content ? response.message.content : `*${(response.message.thinking || "Generated nothing")}*`)
                .trim().substring(0, 2000);
            await workingMessage.edit({ content: messageContent || "???" });
            console.log("done generating for prompt", response);
        } catch (err) {
            console.warn(err);
            return workingMessage.edit("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;