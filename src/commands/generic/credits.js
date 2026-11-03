const discord = require("discord.js");

const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "credits";
        this.description = "View creation credits for gronk.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };
        this.slash = {
            options: []
        };
    }

    convertSlashCommand(interaction, util) {
        interaction.author = interaction.member.user;
        return [interaction, [], util];
    }

    async invoke(message) {
        const embed = new discord.MessageEmbed();
        embed.setColor("#00ffaa");
        embed.setTitle('Credits');
        
        embed.setDescription('Thanks to all the contributors & help on the creation of PenguinBot!');
        embed.addFields({
            name: 'gronk forked from',
            value: `PenguinBot`,
            inline: false
        }, {
            name: 'PenguinBot Contributors',
            value: `JeremyGamer13, MubiLop, godslayerakp, jwklong, ianyourgod, enhancedrock,`
                + " " + `anonygoose, FreshPenguin112, enderhacker, PuzzlingGGG, 10000000_fireflies`,
            inline: false
        }, {
            name: 'Non-affiliation',
            value: `gronk is not officially affiliated with [PenguinMod](https://penguinmod.com/). gronk just uses the PenguinBot project as a base.`,
            inline: false
        });

        message.reply({
            embeds: [embed],
            ephemeral: true,
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;