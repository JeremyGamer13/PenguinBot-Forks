const childProcess = require("child_process");

class Command {
    constructor() {
        this.name = "pull";
        this.description = "Pull from branch";
        this.attributes = {
            unlisted: true,
            adminInclusive: ['462098932571308033'],
            permission: 4,
        };
    }

    async invoke(message, args, util) {
        const shouldntAllow = util.request('preventRuntimeChanges');
        if (shouldntAllow) {
            message.reply('Variable `PREVENT_UPDATES` is set to true on this host.');
            return;
        }

        const repliedMessage = await message.reply('Pulling changes from the GitHub, please wait...');
        childProcess.execSync("git pull origin main");
        if (args[0] === 'restart') {
            repliedMessage.edit('Updated!\nBot is restarting...');
            setTimeout(() => {
                process.exit(50);
            }, 1000);
        } else {
            repliedMessage.edit('Updated!');
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
