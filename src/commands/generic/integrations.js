const discord = require("discord.js");

const env = require('../../util/env-util');
const configuration = require("../../config.js");

class Command {
    constructor() {
        this.name = "integrations";
        this.description = "View all enabled integrations on the bot.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };

        this.alias = ["integration"];
    }

    async invoke(message, _, util) {
        const embed = new discord.MessageEmbed();
        embed.setColor("#ff8800");
        embed.setTitle('Integrations');
        
        embed.addFields([
            {
                name: 'Git',
                value: `${!env.getBool("DISABLE_GIT")}`,
                inline: true
            },
            {
                name: 'jg_node_api',
                value: `${env.getBool("JGNODEAPI_ENABLED")}`,
                inline: true
            },
            {
                name: 'VLC Media Player',
                value: `${env.getBool("VLC_MEDIA_ENABLED")}`,
                inline: true
            },
            {
                name: 'Ollama',
                value: `${env.getBool("OLLAMA_ENABLED")} (vision: ${configuration.funkyCapabilities.ollamaImageProcessingViable})`,
                inline: true
            },
            {
                name: 'Rob',
                value: `${env.getBool("ROB_INTEGRATION_ENABLED")}`,
                inline: true
            },
            {
                name: 'SearXNG',
                value: `${env.getBool("SEARXNG_ENABLED")}`,
                inline: true
            },
            {
                name: 'Demucs',
                value: `${env.getBool("DEMUCS_ENABLED")}`,
                inline: true
            },
            {
                name: 'RVC',
                value: `${env.getBool("RVC_ENABLED")}`,
                inline: true
            },
            {
                name: 'Chatterbox',
                value: `${env.getBool("CHATTERBOX_ENABLED")}`,
                inline: true
            },
            {
                name: 'Object Detection',
                value: `${env.getBool("OBJDETECT_ENABLED")}`,
                inline: true
            },
            {
                name: 'Remove Background',
                value: `${env.getBool("REMOVEBACKGROUND_ENABLED")}`,
                inline: true
            },
            {
                name: 'PSOLA',
                value: `${env.getBool("PSOLA_ENABLED")}`,
                inline: true
            },
            {
                name: 'FluidSynth',
                value: `${env.getBool("FLUIDSYNTH_ENABLED")}`,
                inline: true
            },
            {
                name: 'Polyphone',
                value: `${env.getBool("POLYPHONE_ENABLED")}`,
                inline: true
            },
            {
                name: 'MinecraftWatchdog',
                value: `${env.getBool("MINECRAFT_WATCHDOG_ENABLED")}`,
                inline: true
            },
            {
                name: 'sekai-stickers',
                value: `${!!env.get("SEKAI_STICKERS_PATH")}`,
                inline: true
            },
        ]);

        const deviceLabel = env.get("DEVICE_LABEL");
        embed.setFooter({
            text: `${deviceLabel}: (`
                + `${util.request("isInPersonalMode") ? "personal" : "public"}`
                + `, ` + `${util.request("isInTestMode") ? "testing" : "production"}`
                + ")"
        });

        message.reply({
            embeds: [embed]
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;