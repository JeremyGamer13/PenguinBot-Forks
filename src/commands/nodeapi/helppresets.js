const fs = require("fs/promises");
const path = require("path");

const discord = require("discord.js");

const env = require("../../util/env-util.js");
const stateFill = require("../../util/state-fill.js");
const OptionType = require('../../util/optiontype');

class Command {
    constructor(client) {
        this.name = "helppresets";
        this.description = "Lists all usable overlay & audio commands for Discord Screenshare/Streaming";
        this.descriptionLong = "Lists all usable overlay & audio commands for Discord Screenshare/Streaming"
            + "\n" + "You can use stream overlays with the \`{{prefixPresets}}\` prefix."
            + "\n" + "This command can also be accessed via \`{{prefix}}help {{prefixPresets}}\`";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };

        this.alias = ["presetcommands", "presetcmds", "presethelp"];

        this.client = client;
    }

    getCommandIcon(command) {
        if (command.attributes && command.attributes.helpIcon) return command.attributes.helpIcon;
        if (command.preset.endpoint === "/api/audio") return "🔊";
        if (command.preset.endpoint === "/api/video") return "🖥️";
        if (command.preset.endpoint === "/api/scene") return "📦";
        if (command.preset.endpoint === "/api/tts") return "🎙️";
        return "❓";
    }
    async handleSendingList(message, args, util) {
        const commands = util.request('nodeApiPresets');
        const embed = new discord.MessageEmbed();
        embed.setColor("#ff8800");
        embed.setTitle("Preset List");

        const commandsListed = [];
        for (const commandName of Object.keys(commands).sort()) {
            const command = commands[commandName];
            commandsListed.push(command);
        }

        // create the list message
        const commandOnOnePage = 12;
        const maxPages = Math.ceil(commandsListed.length / commandOnOnePage);
        let buttonRow = [];

        // handle element updates
        let page = 0;
        let disabled = false;
        const setElements = (page) => {
            const commands = commandsListed.slice(page * commandOnOnePage, (page + 1) * commandOnOnePage);
            const commandList = commands.map(command => `${this.getCommandIcon(command)} **${command.name}** — ${command.description}`);
            embed.setDescription(commandList.join('\n'));
            embed.setFooter({ text: `Page ${page + 1} - ${maxPages} | ${commandsListed.length} presets` });

            buttonRow = [
                new discord.MessageActionRow().addComponents([
                    new discord.MessageButton({
                        customId: 'last',
                        style: 'PRIMARY',
                        label: "◀",
                        disabled: disabled || page === 0,
                    }),
                    new discord.MessageButton({
                        customId: 'next',
                        style: 'PRIMARY',
                        label: "▶",
                        disabled: disabled || page === (maxPages - 1),
                    })
                ])

            ];
        };
        setElements(page);
        const commandListMessage = await message.reply({
            embeds: [embed],
            components: buttonRow,
            ephemeral: true,
            fetchReply: true,
        });

        // listen for button presses by the requester
        const collector = commandListMessage.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 5 * 60 * 1000 // 5 minutes
        });
        collector.on('collect', async (i) => {
            if (i.customId === "last") {
                page = Math.max(0, page - 1);
            } else if (i.customId === "next") {
                page = Math.min(page + 1, maxPages - 1);
            }

            setElements(page);
            i.update({
                embeds: [embed],
                components: buttonRow,
            });
        });
        collector.on('end', () => {
            disabled = true;
            setElements(page);
            commandListMessage.edit({
                embeds: [embed],
                components: buttonRow,
            })
        });
    }

    async invoke(message, args, util) {
        // just list all commands?
        if (!args[0])
            return await this.handleSendingList(message, args, util);

        // we are displaying a command
        const prefix = util.request("prefixPresets");
        const commandPrefix = util.request("prefix");
        const commands = util.request('nodeApiPresets');

        const embed = new discord.MessageEmbed();
        embed.setColor("#ff8800");

        const commandName = args[0];
        const command = commands[commandName];
        if (!(commandName in commands)) {
            embed.setTitle("Preset not found");
            embed.setDescription("The preset does not exist.");
            embed.setFooter({ text: `Run "${commandPrefix}help ${prefix}" on its own to view all presets.` });
            return message.reply({ embeds: [embed], ephemeral: true });
        }

        // show the info for this command
        embed.setTitle(`Preset ${prefix}${commandName}`);
        embed.setDescription(command.description);
        embed.addFields({
            name: "Usage",
            value: `\`\`${prefix}${commandName}\`\``,
        });

        const files = [];
        switch (command.preset.endpoint) {
            case "/api/audio":
            case "/api/video":
                try {
                    const assetFolder = command.preset.endpoint === "/api/audio" ? env.get("JGNODEAPI_PRESETS_PREVIEW_FOLDER_AUDIO")
                        : env.get("JGNODEAPI_PRESETS_PREVIEW_FOLDER_VIDEO");
                    if (!assetFolder) throw new Error("Preview folder not configured");
                    const assetPath = path.join(assetFolder, `${command.preset.content.path}`);

                    const stats = await fs.stat(assetPath);
                    const fileSizeInBytes = stats.size;
                    if (fileSizeInBytes > 8 * 1024 * 1024) {
                        embed.setFooter({ text: `The asset for this preset is too large for Discord.` });
                    } else {
                        const assetFile = await fs.readFile(assetPath);
                        const attachment = new discord.MessageAttachment(assetFile, path.basename(assetPath));
                        embed.setFooter({ text: `The attached file is the asset for this preset. It may play with different effects when used.` });
                        files.push(attachment);
                    }
                } catch (er) {
                    console.log(er);
                    embed.setFooter({ text: `The asset for this preset isn't shared.` });
                }
                break;
            case "/api/scene":
                embed.setFooter({ text: `This preset renders a scene of objects in real-time.` });
                break;
            default:
                embed.setFooter({ text: `This preset type cannot be displayed on Discord.` });
                break;
        }
        message.reply({
            embeds: [embed],
            ephemeral: true,
            files: files.length ? files : null,
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
