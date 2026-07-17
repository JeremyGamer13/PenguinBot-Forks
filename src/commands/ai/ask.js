const discord = require("discord.js");

const PenguinAI = require("../../util/penguinai.js");

const configuration = require("../../config.js");

class Command {
    constructor() {
        this.name = "ask";
        this.description = "Speak with the great penguinmod server AI";
        this.descriptionLong = "Speak with the great penguinmod server AI"
            + "\n" + "So we call h8im PenguinGPT right, he's like the rebirth of that one extension"
            + "\n" + "This is NOT my child, this is YOUR child. The penguinmod server's child. You guys suck at paying child support"
            + "\n" + "So PenguinGPT is really stupid and chaotic and takes a while to respond sometimes"
            + "\n" + `To TRAIN PenguinGPT, please chat in <#${configuration.channels.trainAi}> with your own messages!!!!!!!`
            + "\n" + "*(Note: PenguinGPT is only available sometimes and training is disabled when its not available)*";
        this.attributes = {
            permission: 0,
            lockedToPenguinAI: true,
        };

        this.alias = ["prompt", "pmgpt", "penguingpt", "pmai", "penguinai", "penguinmodgpt", "penguinmodai"];
    }
    async invoke(message, args, util) {
        try { await message.channel.sendTyping(); } catch {}

        const response = await PenguinAI.generate({
            prompt: args.join(" "),
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