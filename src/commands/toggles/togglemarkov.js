const configuration = require("../../config");

class Command {
    constructor() {
        this.name = "togglemarkov";
        this.description = "Enable or disable the Markov model taking over for the Ollama model.";
        this.attributes = {
            unlisted: true,
            permission: 3,
        };

        this.alias = ["togglem"];
    }

    invoke(message, args, util) {
        if (!configuration.permissions.toggle.includes(message.author.id))
            return message.reply("You don't have the permission to do this.");

        if (!args[0]) {
            util.state.enabledMarkov = !util.state.enabledMarkov;
            message.reply(`${util.state.enabledMarkov ? "im Really stupid now (markov)" : "im slightly less stupid now (ollama)"}`);
            return;
        }
        util.state.enabledMarkov = String(args[0]).toLowerCase().trim() !== 'true';
        message.reply(`${util.state.enabledMarkov ? "im Really stupid now (markov)" : "im slightly less stupid now (ollama)"}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;