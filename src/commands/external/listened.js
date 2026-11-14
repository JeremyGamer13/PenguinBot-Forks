const Fuse = require("fuse.js");
const discord = require('discord.js');

const env = require("../../util/env-util.js");
const BotState = require("../../util/bot-state.js");
const VLCPoller = require('../../util/vlc-poller.js');
const VLCTracker = require('../../util/vlc-tracker.js');
const FormatTime = require("../../util/format-time.js");
const ProgressBar = require("../../util/progress-bar.js");
const DiscordUtility = require("../../util/utility-discord.js");
const VLCMediaPlayer = require('../../util/vlc-media-player.js');

const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "listened";
        this.description = "see all the songs that i have listened to";
        this.descriptionLong = "see all the songs that i have listened to"
            + "\n" + "- Run the command standalone to see the leaderboard."
            + "\n" + "- specify a song name to view tracked info."
            + "\n" + "**IMPORTANT:** If a song isnt listed here, it **doesnt mean i dont have it in my playlist**."
            + "\n" + "Songs only become listed whenever VLC *randomly shuffles* onto it."
            + "\n"
            + "\n" + "Song names will vary wildly in formatting, which may temporarily duplicate some stats."
            + "\n" + "If they happen, Those will be fixed whenever i feel like it because its based on when i add new songs & cleanup the playlist & such";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };

        this.alias = ["listenedto", "vlclistened", "vlctracker", "vlctracked"];
        this.fuse = new Fuse(VLCTracker.getSongs(), {
            useExtendedSearch: true,
            ignoreLocation: true,
            ignoreDiacritics: true,
            keys: ["fileName"]
        });
    }

    /**
     * @param {import("discord.js").Message} message 
     * @param {string} fileName 
     * @param {import("../../util/utility-command.js")} util 
     */
    async viewSong(message, fileName, util) {
        const information = VLCTracker.getSong(fileName);

        const cleanedName = VLCMediaPlayer.cleanUpName(fileName);
        const potentialYouTubeIdMatch = fileName.match(/\[([a-zA-Z0-9_-]{11})\]/);
        const titleMentionMarkdown = potentialYouTubeIdMatch ? `[**${cleanedName}**](<https://youtu.be/${potentialYouTubeIdMatch[1]}>)` : `**${cleanedName}**`;

        const skippedPercent = 1 - ((information.playTime) / Math.max(1, information.duration * information.appearances));

        const embed = new discord.MessageEmbed();
        embed.setColor('#2e9feb');
        embed.setDescription(titleMentionMarkdown
            + "\n" + `⌛ ${FormatTime.formatTime(information.duration * 1000)} - Listened to for ${FormatTime.formatTime(information.playTime * 1000)}`
            + "\n" + ProgressBar("blue", 10, (1 - skippedPercent) * 100)
            + "\n" + "-#" + " " + `~${(skippedPercent * 100).toFixed(1)}% of this song is skipped`);
        embed.setFooter({ text: `Has been played ${information.appearances} time(s)` });
        message.reply({
            embeds: [embed],
        });
    }
    /**
     * @param {import("discord.js").Message} message 
     * @param {string[]} args 
     * @param {import("../../util/utility-command.js")} util 
     */
    async displayLeaderboard(message, args, util) {
        const embed = new discord.MessageEmbed();
        embed.setColor("#2e9feb");
        embed.setTitle("Most Listened Songs");

        // create the list message
        const songsOnOnePage = 10;
        let maxPages = 1;
        let buttonRow = [];

        // handle element updates
        let page = 0;
        let disabled = false;
        const setElements = async (page) => {
            const songPage = await VLCTracker.getLeaderboard(page, songsOnOnePage);
            maxPages = songPage.totalPages;

            const songList = songPage.entries.map(song => `**${song.rank}.** ${VLCMediaPlayer.cleanUpName(song.fileName)}`);
            embed.setDescription(songList.join('\n') || "Nothing to show here!");
            embed.setFooter({ text: `Page ${page + 1} - ${maxPages} | ${songPage.totalSongs} played so far` });

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
        await setElements(page);
        const songListMessage = await message.reply({
            embeds: [embed],
            components: buttonRow,
            ephemeral: true,
            fetchReply: true,
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });

        // listen for button presses by the requester
        const collector = songListMessage.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 5 * 60 * 1000 // 5 minutes
        });
        collector.on('collect', async (i) => {
            if (i.customId === "last") {
                page = Math.max(0, page - 1);
            } else if (i.customId === "next") {
                page = Math.min(page + 1, maxPages - 1);
            }

            await setElements(page);
            i.update({
                embeds: [embed],
                components: buttonRow,
            });
        });
        collector.on('end', async () => {
            disabled = true;
            await setElements(page);
            songListMessage.edit({
                embeds: [embed],
                components: buttonRow,
            })
        });
    }

    async invoke(message, args, util) {
        if (!(env.getBool("VLC_MEDIA_ENABLED") && env.getBool("VLC_MEDIA_TRACKER")))
            return this.reject(message, "The VLC media player tracker is disabled right now");
        if (!env.getBool("VLC_MEDIA_TRACKER_PUBLIC") && !BotState.state.isInPersonalMode && message.author.id !== env.get("OWNER"))
            return this.reject(message, "Only the owner can view the VLC media player tracker");

        const songQuery = args.join(" ").trim();
        if (songQuery) {
            // NOTE: Right now this doesnt cause performance issues but it might in the future
            this.fuse.setCollection(VLCTracker.getSongs());

            const fuseSearch = this.fuse.search(songQuery);
            const searchedItem = fuseSearch[0];
            if (!searchedItem)
                return this.reject(message, "I dont have any tracked info for that song. I may have it but havent shuffled to it yet.");
            const fileName = searchedItem?.item?.fileName;
            if (!fileName || !VLCMediaPlayer.isAllowedName(fileName))
                return this.reject(message, "I dont have any tracked info for that song. I may have it but havent shuffled to it yet.");
            return this.viewSong(message, fileName, util);
        } else {
            return this.displayLeaderboard(message, args, util);
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;