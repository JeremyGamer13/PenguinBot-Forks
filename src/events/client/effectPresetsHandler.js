const discord = require("discord.js");
const CommandUtility = require("../../util/utility.js");

const env = require("../../util/env-util");
const configuration = require("../../config");

const jgNodeUtils = require("jg-node-utils");

class BotEvent {
    constructor(client) {
        this.listener = "messageCreate";
        this.once = false;

        this.client = client;
    }

    /**
     * @param {discord.Client} client 
     * @param {*} state 
     * @param {discord.Message} message 
     * @returns 
     */
    async invoke(client, state, message) {
        // ignore bots
        if (!message.author) return;
        if (message.author.bot) return;
        if (message.author.system) return;
        if (message.system) return;

        const prefix = state.prefixPresets;
        const commandPrefix = state.prefix;
        
        // dont listen to actual commands
        if (message.content.startsWith(commandPrefix)) return;
    
        // handle cmds because this is perhaps a command
        // NOTE: Preserving whitespace characters like \n is important
        const messageSlice = message.content.slice(prefix.length);
        const indexOfFirstWhitespace = messageSlice.search(/\s/);
        const commandName = indexOfFirstWhitespace === -1 ? messageSlice : messageSlice.slice(0, indexOfFirstWhitespace);
        const command = state.nodeApiPresets[commandName];
        if (!command) return;

        // use command now
        try {
            await command.invoke(message);
        } catch (err) {
            console.error(err);
            message.reply({
                content: `Failed to send effect;\n${err}`.substring(0, 2000),
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        }
    }
}

module.exports = BotEvent;