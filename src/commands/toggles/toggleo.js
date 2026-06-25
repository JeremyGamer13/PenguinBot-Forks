class Command {
    constructor() {
        this.name = "toggleo";
        this.description = "Enable or disable the overlay shits.";
        this.attributes = {
            unlisted: true,
            permission: 4,
        };

        this.alias = ["toggle"];
    }

    invoke(message, args, util) {
        if (!args[0]) {
            util.state.nodeApiOverlays = !util.state.nodeApiOverlays;
            message.reply(`nodeApiOverlays = ${util.state.nodeApiOverlays}`);
            return;
        }
        util.state.nodeApiOverlays = String(args[0]).toLowerCase().trim() !== 'true';
        message.reply(`nodeApiOverlays = ${util.state.nodeApiOverlays}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;