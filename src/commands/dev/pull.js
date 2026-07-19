const childProcess = require("child_process");

const env = require("../../util/env-util");
const configuration = require("../../config.js");

class Command {
    constructor() {
        this.name = "pull";
        this.description = "Pull from branch";
        this.attributes = {
            unlisted: true,
            permission: 3,
        };
    }

    async invoke(message, args, util) {
        if (!configuration.permissions.pull.includes(message.author.id))
            return message.reply("You don't have permission to do this.");

        if (util.request('preventRuntimeChanges')) return message.reply('Variable `PREVENT_UPDATES` is set to true on this host.');
        if (env.getBool("DISABLE_GIT")) return message.reply('Variable `DISABLE_GIT` is set to true on this host.');

        const repliedMessage = await message.reply('Pulling changes from the GitHub, please wait... <:juice:1158872031211831377>');
        childProcess.execSync("git pull origin main");
        if (args[0] === 'restart') {
            repliedMessage.edit('Updated! <:good:1118293837773807657>\nBot is restarting... <:juice:1158872031211831377>');
            setTimeout(() => {
                process.exit(50);
            }, 1000);
        } else {
            repliedMessage.edit('Updated! <:good:1118293837773807657>');
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
