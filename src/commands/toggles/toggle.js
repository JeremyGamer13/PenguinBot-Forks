const configuration = require("../../config");

class Command {
    constructor() {
        this.name = "toggle";
        this.description = "Enable or disable the AI.";
        this.attributes = {
            unlisted: true,
            permission: 3,
        };
    }

    invoke(message, args, util) {
        if (!configuration.permissions.toggle.includes(message.author.id))
            return message.reply("You don't have the permission to do this.");

        if (!args[0]) {
            util.state.enabledAi = !util.state.enabledAi;
            message.reply(`enabledAi = ${util.state.enabledAi}`);
            return;
        }
        util.state.enabledAi = String(args[0]).toLowerCase().trim() !== 'true';
        message.reply(`enabledAi = ${util.state.enabledAi}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;