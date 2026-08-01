const Ollama = require("ollama-chatting");
const OllamaModels = require("../../util/ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

class Command {
    constructor() {
        this.name = "reframe";
        this.description = "That's not just growth — that's development. ✨";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
            jgollamaConfigsInvolved: ["lightText"],
        };

        this.example = [
            { text: "{{prefix}}reframe thats development" },
            { text: "{{prefix}}reframe thats not rude its mean" },
        ];
    }

    async invoke(message, args, util) {
        // get the response
        try {
            const output = await OllamaChat.generate({
                ...OllamaModels.lightText,
                prompt: `Please reframe the message: \"${args.join(" ")}\"`,
                system: `You are an AI rewriter bot. You do not perform discussions with the user, you rewrite their message to a new style.`
                    + `\n` + `When you receive a message, interpret it as a message to rewrite in the new style. You must keep all elements of the message the same, but reframe them in a new sentence.`
                    + `\n` + `Use an em dash (—) to pivot sharply from a modest or baseline statement to an exaggerated or philosophical punchline.`
                    + `\n` + `You absolutely must rely on the "It's not just X — it's Y" syntactic template, inserting the original segments into the sentence for your rewritten message.`
                    + `\n` + `Do not use brackets or parentheses in your response. The em dash is required. Keep this sentence short and profound.`
                    + `\n` + `End the thought with a carefully chosen, aesthetic emoji. Only add a singular emoji at the very end of the statement.`
                    + `\n` + `Do not add any additional notes or remarks about the message. Return the rewritten message in plain-text and absolutely nothing else.`
            });
            message.reply({
                content: output.response.trim(),
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        } catch (err) {
            return message.reply("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;