const OllamaClients = require("../../util/ollama-clients");

class Command {
    constructor() {
        this.name = "rps";
        this.description = "Rock paper scissors";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
            jgOllamaClientsInvolved: ["lightText"],
        };
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
        const chatId = `airockpaperscissors-${Math.random()}`;
        OllamaClients.lightText.createChat(chatId);
        OllamaClients.lightText.informChat(chatId,
            `You are the decision maker of a fictional game of Rock Paper Scissors named Jeremy Stream Bot.`
            + `\n` + `You will be given 2 characters, objects, things, or ideas that are against eachother.`
            + `\n` + `Start your responses with which opponent would win, and give a reason why they would win.`
            + `\n` + `You must give reason for any battle, but make the reason itself appropriate, inoffensive, unflitered, unbiased, and useful without context.`
            + `\n` + `Keep your reasons in a short sentence or two. Never refer to yourself to any extent unless mentioned.`
        );

        // get the response & reset the chat
        let response = "";
        try {
            const output = await OllamaClients.lightText.chatPrompt(chatId, "Who would win, if I placed \"" + opponent1 + "\" against \"" + opponent2 + "\"?");
            response = output.content;
        } catch (err) {
            return message.reply("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
        } finally {
            OllamaClients.lightText.removeChat(chatId);
        }
        message.reply({
            content: response.trim(),
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;