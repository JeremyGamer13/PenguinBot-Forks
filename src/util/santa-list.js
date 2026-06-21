const discord = require("discord.js");
const Database = require('sync-json-database');
const tryCatch = require("./try-catch");
const env = require("./env-util");

const SantaListDB = new Database('./databases/santa-list.json');

const Ollama = require("ollama-chatting");
const OllamaModels = require("./ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

const configuration = require("../config");
const SantaPrompt = tryCatch(() => require('../resources/santa-prompt')) || "";
const GrinchPrompt = tryCatch(() => require('../resources/grinch-prompt')) || "";
const isMessageUnsafeForAgent = tryCatch(() => require('./ai-unsafe')) || (() => false);
const makeAdditionalPrompt = tryCatch(() => require('./santa-additional-prompt')) || (() => "");

class SantaList {
    static santaPrompt = SantaPrompt;
    static grinchPrompt = GrinchPrompt;

    static cleanResponse(response, fallback) {
        let finalResponse = response ? response.trim() : "";
        if (!response || response.length > 1024) {
            finalResponse = fallback;
        }
        return finalResponse;
    }
    static getResponseWithReplacer(orgResponse) {
        const match = orgResponse.match(/\{\{(.*?)\}\}/);
        return [orgResponse.replace(/\{\{.*?\}\}/, "").trim(), match ? match[1] : null];
    }
    static matchReplacerToStatus(replacer) {
        switch (replacer) {
            case "GOOD":
            case "NICE":
                return "nice";
            case "EVIL":
            case "NAUGHTY":
                return "naughty";
            case "UNSAFE":
                return "unsafe";
            case "INDECISIVE":
                return "indecisive";
            default:
                return;
        }
    }

    /**
     * Determines the user's santa list status, and gives a message
     * @param {string} wish 
     * @param {string?} additionalPrompt 
     * @returns {Promise<{ reflection:string, status:"nice"|"naughty"|"indecisive"|"unsafe" }>}
     */
    static async santaReflectsOn(wish, additionalPrompt) {
        if (!env.getBool("OLLAMA_ENABLED")) throw new Error("Ollama not available");
        if (!configuration.funkyCapabilities.ollamaClients.genericIO) throw new Error("AI model not available");
        
        // make a chat, tell it the instructions, and then get the response
        let response = "";
        if (isMessageUnsafeForAgent(wish)) {
            response = "{{UNSAFE}}";
        } else {
            // get the response
            try {
                const prompt = `${this.santaPrompt}` + (additionalPrompt ? `\n${additionalPrompt}` : "");
                const output = await OllamaChat.generate({
                    ...OllamaModels.genericIO,
                    prompt: wish,
                    system: prompt
                        + "\n"
                        + "\n" + "Now the user will send their wish below. Please use the information provided to you earlier."
                            + " " + "Please respond only in the English language, regardless of the user's preferences."
                });
                response = output.response;
                console.log(prompt, response);
            } catch (err) {
                console.warn("prompt gen failked", err);
            }
        }

        // cleanup the response and get the {{STATUS}}
        const cleanResponse = this.cleanResponse(response, "Hohoho!");
        const [finalResponse, replacerText] = this.getResponseWithReplacer(cleanResponse);
        const listStatus = this.matchReplacerToStatus(replacerText);
        return {
            reflection: finalResponse,
            status: listStatus,
        };
    }
    /**
     * Whether or not the grinch thinks they are evil and deserve their wish "nice" or their wish is too nice and dont deserve it "naughty"
     * @param {string} wish 
     * @param {string?} additionalPrompt 
     * @returns {Promise<{ reflection:string, status:"nice"|"naughty"|"indecisive"|"unsafe" }>}
     */
    static async grinchReflectsOn(wish, additionalPrompt) {
        if (!env.getBool("OLLAMA_ENABLED")) throw new Error("Ollama not available");
        if (!configuration.funkyCapabilities.ollamaClients.genericIO) throw new Error("AI model not available");
        
        // make a chat, tell it the instructions, and then get the response
        let response = "";
        if (isMessageUnsafeForAgent(wish)) {
            response = "{{UNSAFE}}";
        } else {
            // get the response
            try {
                const prompt = `${this.grinchPrompt}` + (additionalPrompt ? `\n${additionalPrompt}` : "");
                const output = await OllamaChat.generate({
                    ...OllamaModels.genericIO,
                    prompt: wish,
                    system: prompt
                        + "\n"
                        + "\n" + "Now the user will send their wish below. Please use the information provided to you earlier."
                        + " " + "Please respond only in the English language, regardless of the user's preferences."
                });
                response = output.response;
                console.log(prompt, response);
            } catch (err) {
                console.warn("prompt gen failked", err);
            }
        }

        // cleanup the response and get the {{STATUS}}
        const cleanResponse = this.cleanResponse(response, "Grrr!");
        const [finalResponse, replacerText] = this.getResponseWithReplacer(cleanResponse);
        const listStatus = this.matchReplacerToStatus(replacerText);
        return {
            reflection: finalResponse,
            status: listStatus,
        };
    }

    /**
     * @type {(message:discord.Message) => string}
     * @param {discord.Message} message 
     * @returns {string} a prompt to append to the system prompt
     */
    static makeAdditionalPrompt = makeAdditionalPrompt;

    static has(userId) {
        return SantaListDB.has(userId);
    }
    static get(userId) {
        return SantaListDB.get(userId);
    }
    static saveValue(userId, nice, santaResponse) {
        const value = { nice, santaResponse };
        SantaListDB.set(userId, value);
        return value;
    }

    /**
     * @param {discord.User} user 
     * @param {{ nice:boolean, santaResponse:string }} value 
     */
    static async postValue(user, value) {
        const webhookUrl = env.get("SANTA_LIST_WEBHOOK");
        await fetch(webhookUrl, {
            headers: { "Content-Type": "application/json" },
            method: "POST",
            body: JSON.stringify({
                embeds: [{
                    "title": user.username + " is on the " + (value.nice ? "nice" : "naughty") + " list!",
                    "description": value.santaResponse + ` <@${user.id}>`,
                    "author": {
                        "name": "Santa Claus",
                        "icon_url": "https://pics.clipartpng.com/Cute_Santa_PNG_Clipart-21.png"
                    },
                    "color": value.nice ? 0x00ff00 : 0xff0000
                }],
                "allowed_mentions": {
                    "parse": [],
                    "users": [],
                    "roles": [],
                    replied_user: false
                }
            })
        });
    }
    /**
     * @param {discord.User} user 
     * @param {{ nice:boolean, grinchResponse:string }} value 
     */
    static async postValueStolen(user, value) {
        const webhookUrl = env.get("SANTA_WISHLIST_WEBHOOK");
        await fetch(webhookUrl, {
            headers: { "Content-Type": "application/json" },
            method: "POST",
            body: JSON.stringify({
                embeds: [{
                    "title": user.username + " got their wish STOLEN!!!",
                    "description": value.grinchResponse + ` <@${user.id}>`,
                    "author": {
                        "name": "The GRINCH",
                        "icon_url": "https://deadline.com/wp-content/uploads/2016/06/the-grinch.jpg"
                    },
                    "color": value.nice ? 0xffff00 : 0xff0000
                }],
                "allowed_mentions": {
                    "parse": [],
                    "users": [],
                    "roles": [],
                    replied_user: false
                }
            })
        });
    }
}

module.exports = SantaList;