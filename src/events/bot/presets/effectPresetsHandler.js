const discord = require("discord.js");
const jgNodeUtils = require("jg-node-utils");

const configuration = require("../../../config.js");

const env = require("../../../util/env-util.js");
const DiscordUtility = require("../../../util/utility-discord.js");
const BotEventEmitter = require("../../../util/bot-event-emitter.js");

const BaseBotEvent = require("../../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "userSentMessage";
        this.handler = BotEventEmitter;
        this.once = false;

    }

    /**
     * @param {discord.Message} message 
     * @returns 
     */
    async invoke(message) {
        // ignore bots
        if (!message.author) return;
        if (message.author.bot) return;
        if (message.author.system) return;
        if (message.system) return;

        const prefix = this.state.prefixPresets;
        const commandPrefix = this.state.prefix;
        
        // dont listen to actual commands
        if (message.content.startsWith(commandPrefix)) return;
        // listen for prefix only
        if (!message.content.startsWith(prefix)) return;
    
        // handle cmds because this is perhaps a command
        // NOTE: Preserving whitespace characters like \n is important
        const messageSlice = message.content.slice(prefix.length);
        const indexOfFirstWhitespace = messageSlice.search(/\s/);
        const commandName = indexOfFirstWhitespace === -1 ? messageSlice : messageSlice.slice(0, indexOfFirstWhitespace);
        const command = this.state.nodeApiPresets[commandName];
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