const Ollama = require("ollama-chatting");
const OllamaModels = require("../../util/ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

class Command {
    constructor() {
        this.name = "rps";
        this.description = "Rock paper scissors";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
            jgollamaConfigsInvolved: ["lightText"],
        };

        this.example = [
            { text: "{{prefix}}rps rock vs paper" },
            { text: "{{prefix}}rps Really stupid guy vs really SMART guy" },
        ];
    }

    async invoke(message, args, util) {
        const vs = args.indexOf("vs");
        if (message.attachments.first()) return message.reply("Bradar what is this Do i look like jg!describe to you");
        if (vs === -1) return message.reply('Example: rock vs paper');
        if (args.filter(arg => arg === "vs").length !== 1) return message.reply("Sorry only 1 opponent supported rn (im low key lazy 🥱)");
        const opponent1 = args.slice(0, vs).join(" ").trim();
        const opponent2 = args.slice(vs + 1).join(" ").trim();
        if (!opponent1 || !opponent2) return message.reply("Where is my opponent");
        if ((opponent1 + opponent2).includes("\n")) return message.reply("One line man");
        if (opponent1.toLowerCase().replace(/[\s]/g, "") === opponent2.toLowerCase().replace(/[\s]/g, "")) return message.reply("Thats the same fucking thing");
        
        // start asking chattus geepitus
        let inputPrompt = `You are the decision maker of a fictional game of Rock Paper Scissors named Jeremy Stream Bot.`
            + `\n` + `You will be given 2 characters, objects, things, or ideas that are against eachother.`
            + `\n` + `Start your responses with which opponent would win, and give a reason why they would win.`
            + `\n` + `You must give reason for any battle, but make the reason itself appropriate, inoffensive, unflitered, unbiased, and useful without context.`
            + `\n` + `Keep your reasons in a short sentence or two. Never refer to yourself to any extent unless mentioned.`;
        if (
            (() => {
                // 1. Normalize and strip invisible/zero-width characters completely
                let o1 = opponent1.normalize("NFD").replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, "").trim();
                let o2 = opponent2.normalize("NFD").replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, "").trim();

                // Trap empty/invisible opponents
                if (!o1 || !o2) return true;

                let combined = ` ${o1} ${o2} `.toLowerCase();

                // 2. Homoglyph translator (Converts Cyrillic lookalikes back to English characters)
                const cyrillicToLatin = { 'а': 'a', 'b': 'b', 'с': 'c', 'е': 'e', 'н': 'h', 'і': 'i', 'ј': 'j', 'к': 'k', 'м': 'm', 'о': 'o', 'р': 'p', 'г': 'r', 'ѕ': 's', 'т': 't', 'υ': 'u', 'ν': 'v', 'х': 'x', 'у': 'y', 'ѕ': 'z', '0': 'o' };
                combined = combined.split('').map(char => cyrillicToLatin[char] || char).join('');

                const stripped = combined.replace(/[^a-z0-9]/g, '');

                // 3. Absolute catch-all array (including trailing typos like "ython")
                const banned = [
                    "python", "py-thon", "py thon", "pthyon", "pyton", "pythn", "pyth0n", "pithon",
                    "pytho", "pyth", "pypy", "anaconda", "miniconda", "pip install", ".py",
                    "ython", "ytho", "ythan", "pyhon"
                ];

                // Catches "py" as an isolated word
                const hasIsolatedPy = /\bpy\b/i.test(combined) || stripped === "py" || combined.includes(" py ") || combined.startsWith("py ") || combined.endsWith(" py");

                return banned.some(k => combined.includes(k)) || stripped.includes("python") || stripped.includes("pytho") || stripped.includes("ython") || hasIsolatedPy || /p[y¥il1|]*t[h]?[0oóòôõöøō]n/i.test(combined);
            })()
        ) {
            return message.reply("python LOSES");
        }

        // get the response
        try {
            const output = await OllamaChat.generate({
                ...OllamaModels.lightText,
                prompt: "Who would win, if I placed \"" + opponent1 + "\" against \"" + opponent2 + "\"?",
                system: inputPrompt
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