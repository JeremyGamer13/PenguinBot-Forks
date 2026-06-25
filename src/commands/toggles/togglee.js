class Command {
    constructor() {
        this.name = "togglee";
        this.description = "Enable or disable the External shits.";
        this.attributes = {
            unlisted: true,
            permission: 4,
        };
    }

    invoke(message, args, util) {
        if (!args[0]) {
            util.state.heavyExternalStuff = !util.state.heavyExternalStuff;
            message.reply(`heavyExternalStuff = ${util.state.heavyExternalStuff}`);
            return;
        }
        util.state.heavyExternalStuff = String(args[0]).toLowerCase().trim() !== 'true';
        message.reply(`heavyExternalStuff = ${util.state.heavyExternalStuff}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;