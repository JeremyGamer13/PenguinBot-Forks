const configuration = require("../../config");
const evalEnvironment = require("../../util/eval-environment");

class Command {
    constructor(client) {
        this.name = "eval";
        this.description = "admin";
        this.attributes = {
            unlisted: true,
            permission: 3,
        };

        this.alias = ["e"]
        this.client = client;
    }

    reject(message) {
        message.reply({
            files: ['./assets/randomImages/pleasespeed.png']
        });
    }

    run(message, args, util) {
        if (!configuration.permissions.eval.includes(message.author.id)) {
            this.reject(message);
            return;
        }

        this._lastMessage = message;
        this._alreadyReplied = false;

        let result = '';
        let failed = false;
        try {
            const command = args.join(' ');
            console.log('\n');
            console.log(`${message.author.username}:`);
            console.log(command);
            console.log('\n');

            const evalFunc = evalEnvironment.bind(this);
            result = evalFunc(command, {
                message,
                args,
                util,
                command,
            });
        } catch (err) {
            result = String(err);
            failed = true;

            if (err.stack) {
                result = `${err.stack}`;
            }
        }
        message.reply(`${failed ? '❌ - epic fucking fail loser\n' : ''}\`\`\`${failed ? result : JSON.stringify(result)}\`\`\``);
    }
    invoke(message, args, util) {
        try {
            this.run(message, args, util);
        } catch (err) {
            message.reply('you. IDIOT.');
            console.log(err);
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
