class Command {
    constructor() {
        this.name = "togglea";
        this.description = "Enable or disable the audio shits.";
        this.attributes = {
            unlisted: true,
            permission: 4,
        };
    }

    invoke(message, args, util) {
        if (!args[0]) {
            util.state.nodeApiAudios = !util.state.nodeApiAudios;
            message.reply(`nodeApiAudios = ${util.state.nodeApiAudios}`);
            return;
        }
        util.state.nodeApiAudios = String(args[0]).toLowerCase().trim() !== 'true';
        message.reply(`nodeApiAudios = ${util.state.nodeApiAudios}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;