const discord = require("discord.js");

const PenguinModClient = require("../../util/penguinmod-client");
const PenguinModFormat = require("../../util/penguinmod-format");
const OptionType = require('../../util/optiontype');

class Command {
    constructor() {
        this.name = "random";
        this.description = "Gets a random PenguinMod project.";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
        };
        this.slash = {
            options: []
        };
    }

    convertSlashCommand(interaction) {
        return [interaction];
    }

    async invoke(message) {
        const randomProjects = await PenguinModClient.projects.getRandomProjects();
        const project = randomProjects[0];
        message.reply({ embeds: [PenguinModFormat.embedProject(project, { unknown: true })] });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
