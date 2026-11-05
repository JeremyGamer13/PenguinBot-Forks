const discord = require("discord.js");

const configuration = require("../../../config.js");

const env = require("../../../util/env-util.js");
const SantaList = require("../../../util/santa-list.js");
const DiscordUtility = require("../../../util/utility-discord.js");
const BotEventEmitter = require("../../../util/bot-event-emitter.js");

const BaseBotEvent = require("../../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "userSentMessage";
        this.once = false;

        this.handler = BotEventEmitter;

        this.publicOnly = true;
        this.productionOnly = true;
    }

    /**
     * @param {discord.Message} message 
     * @returns 
     */
    async invoke(message) {
        // Santa list!!!!!!
        const checkMsg = message.content.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
        const checkStarters = ["iwish", "iwant", "willi", "santaiwish", "santaiwant", "santawilli"];
        const checkMoreAreYouDumbs = ["iwishfor", "williget", "santaiwishfor", "santawilliget"];
        if (true) return;
        if (!configuration.channels.funkySantaList) return;
        if (message.channel.id !== configuration.channels.funkySantaList) return;
        if (!checkStarters.some(starter => checkMsg.startsWith(starter))) return;
        
        // santas
        if (message.attachments.size > 0) return message.reply("no attachments gng");
        if (checkStarters.includes(checkMsg) || checkMoreAreYouDumbs.includes(checkMsg)) return message.reply("are you dumb");
        // if (SantaList.has(message.author.id)) return message.reply("your fate has been decided");

        // cooldown
        if (this.state.santaListProcessing)
            return message.reply({
                content: "we are waiting for SANTA be PATIENT....",
                files: ["./assets/randomImages/wait.png"]
            });
        // if (this.state.santaListLastAddedTo > Date.now() - 3000) return;

        // random shit
        if (Math.random() * 100 < 0.067) message.reply("hahaha you got the 0.067% chance hahaha SIX SEEVEEN 😛👅👅");
        // if (Math.random() * 100 < 0.1) message.reply("ts aint happening gng 😭✌️");
        if (Math.random() * 100 < 0.1) message.reply("Fuck you twin 🦃 🦃🗣️🗣️🎉");
        // if (Math.random() * 100 < 0.1) message.reply("Something will happen on the 1st of December. He awaits. Shut your curtains, lock your doors, don't look. He hungers. You've been warned");

        // ok lets actually generate now gng
        this.state.santaListProcessing = true;
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
                this.state.santaListLastAddedTo = Date.now();
            }
        } catch (error) {
            console.warn("Failed stanta list", error);
            message.reply("you killed santa what the fuck");
        } finally {
            this.state.santaListProcessing = false;
        }
    }
}

module.exports = BotEvent;