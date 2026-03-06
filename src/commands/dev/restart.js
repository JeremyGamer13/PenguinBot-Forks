class Command {
    constructor() {
        this.name = "restart";
        this.description = "Restart the bot";
        this.attributes = {
            unlisted: true,
            permission: 4,
        };
    }

    async invoke(message, _, util) {
        const shouldntRestart = util.request('preventRuntimeChanges');
        if (shouldntRestart) {
            message.reply('Variable `PREVENT_UPDATES` is set to true on this host.');
            return;
        }

        await message.reply('Restarting bot...');
        process.exit(50);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;