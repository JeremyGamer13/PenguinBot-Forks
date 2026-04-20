const discord = require("discord.js");
const CommandUtility = require("../../util/utility.js");

const handleBotAutoResponse = require('../../resources/responses/index.js');
const configuration = require("../../config.js");
const env = require("../../util/env-util.js");

const isInTestMode = process.argv[2] === 'test';
const prefix = isInTestMode ? env.get("PREFIX_TEST") : env.get("PREFIX");

const SantaList = require("../../util/santa-list.js");

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

        const isTestingInPublic = isInTestMode && !(env.getBool("CHECK_FOR_DEFAULT_TEST_SERVERS") && message.guildId === "746156168560508950")

        // ignore #spam
        if (
            message.channel.id === configuration.channels.spam
            || (message.channel.parent && message.channel.parent.id === configuration.channels.spam)
        ) return;

        // Santa list!!!!!!
        const checkMsg = message.content.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
        const checkStarters = ["iwish", "iwant", "willi", "santaiwish", "santaiwant", "santawilli"];
        const checkMoreAreYouDumbs = ["iwishfor", "williget", "santaiwishfor", "santawilliget"];
        if (false && message.channel.id === "1444881035719606373" && checkStarters.some(starter => checkMsg.startsWith(starter))) {
            if (message.attachments.size > 0) return message.reply("no attachments gng");
            if (checkStarters.includes(checkMsg) || checkMoreAreYouDumbs.includes(checkMsg)) return message.reply("are you dumb");
            // if (SantaList.has(message.author.id)) return message.reply("your fate has been decided");
            if (state.santaListProcessing) return message.reply({
                content: "we are waiting for SANTA be PATIENT....",
                files: ["./assets/randomImages/wait.png"]
            });
            // if (state.santaListLastAddedTo > Date.now() - 3000) return;

            // random shit
            if (Math.random() * 100 < 0.067) message.reply("hahaha you got the 0.067% chance hahaha SIX SEEVEEN 😛👅👅");
            // if (Math.random() * 100 < 0.1) message.reply("ts aint happening gng 😭✌️");
            if (Math.random() * 100 < 0.1) message.reply("Fuck you twin 🦃 🦃🗣️🗣️🎉");
            // if (Math.random() * 100 < 0.1) message.reply("Something will happen on the 1st of December. He awaits. Shut your curtains, lock your doors, don't look. He hungers. You've been warned");

            // ok lets actually generate now gng
            state.santaListProcessing = true;
            try {
                // GRINCH
                if (Math.random() < 0.125) {
                    // see what THE GRINCH thinks of their wish, if its a "nice" wish then the grinch likes how evil they are
                    const response = await SantaList.grinchReflectsOn(message.content.trim());
                    if (response.status === "unsafe") return;
                    // post then inform the user
                    await SantaList.postValueStolen(message.author, {
                        nice: response.status === "nice",
                        grinchResponse: response.reflection
                    });
                    message.react("⚠️");
                } else {
                    // // check if they have been naughty this year
                    const additionalPrompt = SantaList.makeAdditionalPrompt(message);
                    // see what santa thinks of their wish, if its naughty wish then they are on naughty list
                    const response = await SantaList.santaReflectsOn(message.content.trim(), additionalPrompt);
                    if (response.status === "unsafe") return;
                    // save response & post then inform the user
                    const value = SantaList.saveValue(message.author.id, response.status === "nice", response.reflection);
                    await SantaList.postValue(message.author, value);

                    message.react("📃");
                    state.santaListLastAddedTo = Date.now();
                }
            } catch (error) {
                console.warn("Failed stanta list", error);
                message.reply("you killed santa what the fuck");
            } finally {
                state.santaListProcessing = false;
            }
            return;
        }
    }
}

module.exports = BotEvent;