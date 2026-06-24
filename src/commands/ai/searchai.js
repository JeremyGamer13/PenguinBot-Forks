const discord = require("discord.js");
const Ollama = require("ollama-chatting");
const OllamaModels = require("../../util/ollama-models.js");

const SearXNG = require("../../util/searxng.js");

class Command {
    constructor() {
        this.name = "searchai";
        this.description = "Im so evil and im also Google AI Overview... so i didnt even need to say im evil";
        this.attributes = {
            // NOTE: For now, I've decided it's too risky to give public users search ability:
            // - IP grabbing & displaying is likely possible
            // - People can search concerning things under my network (very illegal stuff too)
            // - May be possible to ratelimit SearXNG too heavily
            // - AI can read unpredictable results which are inappropriate for PM
            // Will reconsider when I've at least put searches under a proxy of some kind to solve IP problems
            permission: 4,
            jgollamaConfigsInvolved: ["searchOverview"],
        };
    }

    /** @param {import("discord.js").Message} message  */
    async invoke(message, args, util) {
        const searchQuery = args.join(" ").trim();
        if (searchQuery.length <= 0) return message.reply("Hey dipshit i cant search for nothing");
        if (!util.automodAllows(searchQuery, true)) return message.reply("thats Illegal");
        
        // start asking chattus geepitus get the response
        message.channel.sendTyping();
        try {
            const ollamaChat = new Ollama({ host: OllamaModels.url });
            const output = await ollamaChat.chat({
                ...OllamaModels.searchOverview,
                messages: [{
                    role: "system",
                    content: `You are a summarization search engine.`
                        + `\n` + `You must deny any request that is entirely harmful, malicious or inappropriate.`
                        + `\n` + `You are not allowed to search for any type of drugs, violent content, sexual content, illegal activity, or dangerous weaponry.`
                        + `\n` + `Searching individuals is okay, but avoid diving into specific PII.`
                        + `\n`
                        + `\n` + `Use your tools to search for queries. Summarize the information and give specific URLs if the user asked for a link, url, or to "show them."`
                        + `\n` + `The tools can be used in combination or be used multiple times.`
                        + `\n`
                        + `\n` + `Keep your results appropriate, unflitered, unbiased, and useful without context.`
                        + `\n` + `Keep your results in a tight and compact format if possible, avoiding large table or list formats. Never refer to yourself specifically to any extent.`
                }, {
                    role: "user",
                    content: `Search for ${searchQuery}`
                }]
            }, (chunk) => {
                // chunk.message.content & chunk.message.thinking contain stitched together versions of all the chunks so far.
                // to access this specific chunk's generation, we use chunk.message.chunk
                if (chunk.message.chunk.thinking) process.stdout.write(chunk.message.chunk.thinking);
                if (chunk.message.chunk.content) process.stdout.write(chunk.message.chunk.content);
                if (chunk.done && chunk.message.tool_calls) console.log(`\n`, chunk.message.tool_calls.map(call => call.function), `\n`);
            });
            console.log(output.messages);
            message.reply({
                content: output.message.content.trim() || "I didn't find anything for that.",
                flags: discord.MessageFlags.FLAGS.SUPPRESS_EMBEDS,
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        } catch (err) {
            console.error(err);
            return message.reply("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;