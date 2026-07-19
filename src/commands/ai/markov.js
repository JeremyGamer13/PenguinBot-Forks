const discord = require("discord.js");

const PenguinAI = require("../../util/penguinai.js");

const configuration = require("../../config.js");

class Command {
    constructor() {
        this.name = "markov";
        this.description = "Speak with PenguinAI with less intelligence";
        this.descriptionLong = "Speak with PenguinAI as a Markov model/chain"
            + "\n" + "This version of PenguinAI is also used when the LLM is unavailable."
            + "\n" + "You are more likely to get sentence-copies and imitated messages from the Markov model."
            + "\n" + "See the ask command for training info.";
        this.attributes = {
            permission: 0,
            lockedToPenguinAI: true,
        };
    }
    async invoke(message, args, util) {
        try { await message.channel.sendTyping(); } catch {}

        const response = await PenguinAI.generate({
            prompt: args.join(" "),
            markov: true,
        });
        message.reply({
            content: response,
            flags: discord.MessageFlags.FLAGS.SUPPRESS_EMBEDS,
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