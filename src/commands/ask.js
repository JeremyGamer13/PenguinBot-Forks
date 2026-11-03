// DISCLOSURE: AI generated (adapted ping command into an ask command)
const discord = require("discord.js");

const OptionType = require('../util/optiontype.js');
const gronkResponse = require("../util/gronk-response.js");

const BaseCommand = require("../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "ask";
        this.description = "Ask gronk a question.";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
        this.slash = {
            options: [{
                type: OptionType.STRING,
                name: "text",
                required: true,
                description: "What would you like to ask?",
            }]
        };
    }

    convertSlashCommand(interaction, util) {
        const text = interaction.options.getString("text");
        interaction.author = interaction.member.user;
        return [interaction, text.split(" "), util];
    }

    async invoke(message, args) {
        const text = args.join(" ");
        if (!text.trim())
            return message.reply({
                content: "You need to provide something to ask!",
                ephemeral: true,
            });

        const responseString = await gronkResponse(text, message.channel);
        return message.reply({
            content: responseString.substring(0, 2000),
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true,
            }
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
