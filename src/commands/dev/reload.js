const fs = require("fs");
const path = require("path");

class Command {
    constructor(client) {
        this.name = "reload";
        this.description = "Reload a command in the bot. Only works for commands without any local dependencies (\"require\"s from a file path).";
        this.attributes = {
            unlisted: true,
            permission: 4,
        };

        this.client = client;
    }

    async invoke(message, args, util) {
        const commands = util.request('commands');

        const shouldntRestart = util.request('preventRuntimeChanges');
        if (shouldntRestart) {
            message.reply('Variable `PREVENT_UPDATES` is set to true on this host.');
            return;
        }

        let fileName = args.join(' ');
        if (!fileName.endsWith(".js")) {
            fileName += ".js";
        }
        const fileLocation = path.join(__dirname, "../", fileName);
        if (!path.dirname(fileLocation).startsWith(path.dirname(__dirname))) {
            return message.reply('Specify a file within the `src/commands` folder.');
        }

        if (!fs.existsSync(fileLocation)) {
            return message.reply('The file does not exist.');
        }
        const cacheFolder = path.join(__dirname, "../../../cache");
        if (!fs.existsSync(cacheFolder)) {
            fs.mkdirSync(cacheFolder);
        }
        const cacheJsFile = path.join(cacheFolder, `${Math.random() * 1000}-${path.basename(fileLocation)}.js`);
        fs.copyFileSync(fileLocation, cacheJsFile);

        let module = require(cacheJsFile);
        if (module.name) {
            const commandClass = module;
            module = {
                [module.name]: commandClass
            };
        }

        const commandsLoaded = [];
        for (const commandName in module) {
            const commandClass = module[commandName];
            const command = new commandClass(this.client, util.state);

            // Define a function to create a new instance of the command
            command.instantiate = () => {
                return new commandClass(this.client, util.state);
            };

            // Register command and aliases in state.commands map
            commands[command.name] = command;

            if (Array.isArray(command.alias)) {
                for (const alias of command.alias) {
                    commands[alias] = command;
                }
            }

            console.log('Registered', command.name);
            commandsLoaded.push(command.name);
        }
        message.reply(`Reloaded commands: ${commandsLoaded.join(", ")}`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;