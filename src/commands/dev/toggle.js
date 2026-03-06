class Command {
    constructor() {
        this.name = "toggle";
        this.description = "Enable or disable the shits.";
        this.attributes = {
            unlisted: true,
            permission: 4,
        };
    }

    invoke(message, args, util) {
        if (!args[0]) {
            util.state.nodeApiStuff = !util.state.nodeApiStuff;
            message.reply(`enabled = ${util.state.nodeApiStuff}`);
            return;
        }
        util.state.nodeApiStuff = String(args[0]).toLowerCase().trim() !== 'true';
        message.reply(`enabled = ${util.state.nodeApiStuff}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;