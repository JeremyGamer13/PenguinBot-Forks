const discord = require("discord.js");
const CommandUtility = require("../../util/utility.js");

const handleBotAutoResponse = require('../../resources/responses/index.js');
const configuration = require("../../config");
const env = require("../../util/env-util");

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

        const prefix = state.prefix;

        const isInTestMode = state.isInTestMode;
        const isTestingInPublic = isInTestMode && !(env.getBool("CHECK_FOR_DEFAULT_TEST_SERVERS") && message.guildId === "746156168560508950")

        // ignore #spam
        if (
            message.channel.id === configuration.channels.spam
            || (message.channel.parent && message.channel.parent.id === configuration.channels.spam)
        ) return;
    
        // handle the case where they are not using a cmd but we can still do stuff
        if (!message.content.startsWith(prefix)) {
            // check for stuff we can reply to in a helpful way
            if (env.getBool('RESPOND_TO_KEYWORDS') && !isTestingInPublic) {
                handleBotAutoResponse(message);
            }
            return;
        }
    
        // handle cmds because this is perhaps a command
        // NOTE: Preserving whitespace characters like \n is important
        const messageSlice = message.content.slice(prefix.length);
        const indexOfFirstWhitespace = messageSlice.search(/\s/);
        const commandName = indexOfFirstWhitespace === -1 ? messageSlice : messageSlice.slice(0, indexOfFirstWhitespace);
        const command = state.commands[commandName] || state.alias[commandName];
        if (!command) {
            return message.reply({
                content: `Command not found. Did you mean something else?\nUse \`${prefix}help\` to see a list of commands.`,
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        }

        // Only chop off the first whitespace character, then preserve all the rest
        const argumentsString = messageSlice.slice(commandName.length);
        const indexOfFirstNonWhitespace = argumentsString.search(/\S/);
        const textToSplit = (indexOfFirstNonWhitespace === -1 ? argumentsString : argumentsString.slice(indexOfFirstNonWhitespace));
        const split = textToSplit === "" ? [] : textToSplit.split(" ");
        const isBlocked = CommandUtility.handleCommandBlock(command, message, split);
        if (isBlocked) return;

        // some commands can allow number conversion
        const convertNums = command.attributes.numberConversion === true;
        const args = convertNums ? split.map(arg => isNaN(Number(arg)) ? String(arg) : Number(arg)) : split;
    
        // use command now
        try {
            await command.invoke(message, args, CommandUtility);
        } catch (err) {
            console.error(err);
            message.reply({
                content: `An unknown error occurred.\n${err}`.substring(0, 2000),
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