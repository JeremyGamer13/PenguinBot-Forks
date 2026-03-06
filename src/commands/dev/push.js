const childProcess = require("child_process");

class Command {
    constructor() {
        this.name = "push";
        this.description = "Push to branch";
        this.attributes = {
            unlisted: true,
            permission: 4,
        };
    }

    async invoke(message, args, util) {
        const shouldntAllow = util.request('preventRuntimeChanges');
        if (shouldntAllow) {
            message.reply('Variable `PREVENT_UPDATES` is set to true on this host.');
            return;
        }
        
        const provided = args.join(' ');
        if (!provided) return message.reply('Provide a commit name!');
        const commitName = JSON.stringify(provided.substring(0, 35));
        const repliedMessage = await message.reply('Pushing changes to the GitHub, please wait...');
        childProcess.execSync('git commit -a -m ' + commitName);
        childProcess.execSync('git push origin main');
        repliedMessage.edit('Updated!');
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;