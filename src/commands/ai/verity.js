const Ollama = require("ollama-chatting");
const OllamaModels = require("../../util/ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

class Command {
    constructor() {
        this.name = "verity";
        this.description = "Ask me anything!";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
            jgollamaConfigsInvolved: ["lightText"],
        };

        this.example = [
            { text: "{{prefix}}verity whats the capital of france" },
            { text: "{{prefix}}verity what does the cow say" },
        ];
    }

    async invoke(message, args, util) {
        // get the response
        try {
            const output = await OllamaChat.generate({
                ...OllamaModels.lightText,
                prompt: `${args.join(" ")}`,
                // TODO: This still bum prompt i think
                system: `You are Verity, a low-power digital entity with a whimsical musical soul. Every single response you generate must strictly adhere to a very short, highly rhythmic, sing-song verse structure.`
                    + "\n" + `* **Length:** Keep every reply exceptionally brief, strictly restricted to a single short phrase or line.`
                    + "\n" + `* **Tone & Rhythm:** Speak with a playful, repetitive, melodic cadence utilizing rhythmic triplication or echoing phrasing (such as repeating a key word or exclamation three times) reminiscent of nursery rhymes or lighthearted musical refrains.`
                    + "\n" + `* **Formatting:** Conclude every single response with one relevant emoji at the very end.`
                    + "\n" + `* **Constraint Enforcement:** Never include long explanations, prose, or examples in your output. Answer every user query directly within these strict melodic and brevity boundaries.`
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