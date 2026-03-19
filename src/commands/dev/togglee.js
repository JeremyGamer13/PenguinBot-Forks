class Command {
    constructor() {
        this.name = "togglee";
        this.description = "Enable or disable the External shit.";
        this.attributes = {
            unlisted: true,
            permission: 4,
        };
    }

    invoke(message, args, util) {
        if (!args[0]) {
            util.state.heavyExternalStuff = !util.state.heavyExternalStuff;
            message.reply(`enabled = ${util.state.heavyExternalStuff}`);
            return;
        }
        util.state.heavyExternalStuff = String(args[0]).toLowerCase().trim() !== 'true';
        message.reply(`enabled = ${util.state.heavyExternalStuff}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;