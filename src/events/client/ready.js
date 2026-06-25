const glob = require("glob");

const env = require("../../util/env-util");
const envFill = require("../../util/env-fill");
const configuration = require("../../config");

class BotEvent {
    constructor(client) {
        this.listener = "ready";
        this.once = true;

        this.client = client;
    }

    async invoke(client, state) {
        const isInTestMode = state.isInTestMode;

        // log we are online
        console.log(client.user.tag + " is online!");

        // register commands
        const files = glob.globSync('./src/commands/**')
            .map(file => `../../commands/${file.replace(/\\/g, '/').replace('src/commands/', '')}`)
            .filter(file => file.endsWith('.js'))
            .filter(file => file.substring(file.lastIndexOf("/")).match(/\.{1}/).length === 1);

        // handle files
        let errors = '';
        let failed = false;
        for (const fileName of files) {
            try {
                // modules should be treated as objects with commandName:CommandClass pairs if they arent already
                let module = require(fileName);
                if (module.name) {
                    const commandClass = module;
                    module = {
                        [module.name]: commandClass
                    };
                }

                // register all the commands in this file
                for (const commandName in module) {
                    const commandClass = module[commandName];
                    const command = new commandClass(client, state);

                    // Register command in state.commands map
                    // check that this command name isnt taken by another command or an alias
                    if (state.commands[command.name])
                        throw new Error(`Command name ${command.name} has been taken by existing command`);
                    if (state.alias[command.name])
                        throw new Error(`Command name ${command.name} has been taken by command alias`);
                    // register the command
                    state.commands[command.name] = command;

                    // register aliases in state.alias map
                    if (Array.isArray(command.alias)) {
                        for (const alias of command.alias) {
                            // check that this alias isnt taken by an existing command name or an existing alias
                            if (state.commands[alias])
                                throw new Error(`Alias ${alias} for ${command.name} conflicts with command`);
                            if (state.alias[alias])
                                throw new Error(`Alias ${alias} for ${command.name} conflicts with alias ${state.alias[alias].name}`);
                            // register the command
                            state.alias[alias] = command;
                            console.log('Aliased', command.name, "as", alias);
                        }
                    }

                    console.log('Registered command', command.name);
                }
            } catch (err) {
                console.error('Failed to load', fileName, '\n', err.message);
                errors += `\`\`${fileName}\`\` - ${err.message}\n`;
                failed = true;
            }
        }

        // set our status
        const statusText = isInTestMode ? configuration.status.testing : configuration.status.normal;
        client.user.setPresence({
            status: "online",
            activities: [{
                name: envFill(statusText),
                type: "PLAYING"
            }]
        });
        
        // log
        const mainChannel = await client.channels.cache.get(configuration.channels.botTestingChannel);
        mainChannel.send({
            content: isInTestMode ?
                'Bot has restarted in test mode. Certain features will not be enabled.' :
                'Bot has restarted.'
        });

        // log when commands cant load
        if (failed) {
            mainChannel.send(`Some commands failed to load.\n\n${errors}`.substring(0, 2000));
        }
    }
}

module.exports = BotEvent;