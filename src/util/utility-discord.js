const discord = require("discord.js");

const configuration = require("../config");

const env = require('./env-util.js');
const Utility = require("./utility.js");
const tryCatch = require('./try-catch.js');
const BotState = require("./bot-state.js");
const bypass = require("./bypass-characters.js");
const isCompatibleImage = require('./compatible-images.js');

const automodKeywords = tryCatch(() => require('../resources/basic-automod')) || [];

/**
 * @classdesc Meant to be a helper for common discord-related functions.
 */
class DiscordUtility {
    /** @param {discord.Message} message */
    static getPermissionLevel(message) {
        if (message.member.id === env.get('OWNER')) return 4; // owner
        if (message.member.roles.cache.some(role => configuration.permissions.permission3.includes(role.id))) return 3; // developers
        if (message.member.roles.cache.some(role => configuration.permissions.permission2.includes(role.id))) return 2; // mods
        if (message.member.roles.cache.some(role => configuration.permissions.permission1.includes(role.id))) return 1; // bot dev
        return 0;
    }
    /** @param {discord.Message} message */
    static isFromExclusive(message) {
        const isExclusive = message.member.roles.cache.some(role => configuration.permissions.exclusiveRoles.includes(role.id))
            || configuration.permissions.exclusiveUsers.includes(message.author.id);
        return !!isExclusive;
    }
    /** @param {discord.Message} message */
    static isFromEventManager(message) {
        const isEventManager = message.member.roles.cache.some(role => configuration.permissions.eventManagerRoles.includes(role.id));
        return !!isEventManager;
    }

    /** @param {import("discord.js").Message} message  */
    static makeMessageLink(message) {
        return `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;
    }
    /** @param {import("discord.js").TextChannel} channel  */
    static makeChannelLink(channel) {
        return `https://discord.com/channels/${channel.guildId}/${channel.id}`;
    }

    /**
     * Try as hard as possible to grab a user's avatar. The URL returned may not match the format specified.
     * Dynamic avatars (animated avatars) are only returned if specified, and we can confidently grab one.
     * @param {import("discord.js").GuildMember|import("discord.js").User} user
     * @param {import("discord.js").ImageURLOptions} options 
     * @returns {string}
     */
    static avatarURL(user, options = { format: "png", dynamic: false, size: 256 }) {
        const fallbackUrl = "https://cdn.discordapp.com/embed/avatars/1.png";
        try {
            // if a dynamic avatar is requested, we need to manually check the hash or Discord.js will give us a URL that leads to an error message
            // TODO: When we upgrade to Discord.js v14, consider allowing WEBP here. We dont have any animated WEBP decoders in the bot as of now though, so it's redirected here. 
            if (options.dynamic && options.format === "gif") {
                const avatarHash = user?.avatar;
                const isDynamic = avatarHash?.startsWith?.("a_");
                if (!isDynamic)
                    return this.avatarURL(user, {
                        ...options,
                        dynamic: false,
                        format: "png"
                    });
            } else if (options.dynamic) {
                return this.avatarURL(user, {
                    ...options,
                    dynamic: false
                });
            }

            // try to fallback at all opportunities
            const url = user?.displayAvatarURL?.(options) ?? user?.user?.displayAvatarURL?.(options) ??
                user?.avatarURL?.(options) ?? user?.user?.avatarURL?.(options);
            return url || fallbackUrl;
        } catch {
            return fallbackUrl;
        }
    }

    /**
     * Get the message that this message is replying to
     * @param {import("discord.js").Message} message
     * @returns {Promise<import("discord.js").Message?>}
     */
    static getReply(message) {
        return new Promise((resolve) => {
            if (!(message.reference && message.reference.messageId)) {
                resolve(undefined);
                return;
            }
            const reply = message.reference.messageId;
            message.channel.messages.fetch(reply).then(repliedMessage => {
                resolve(repliedMessage);
            }).catch(() => {
                resolve(undefined);
            });
        });
    }
    static getAttachmentType(attachment) {
        try {
            return attachment.contentType.split(';')[0].split('/')[1];
        } catch {
            return;
        }
    };

    /** @param {import("discord.js").MessageReaction} reaction  */
    static async getReactingUsers(reaction) {
        const maxLimit = 100;

        let allUsers = [];
        let lastId = null;
        if (reaction.partial) await reaction.fetch();
        while (true) {
            const users = await reaction.users.fetch({ limit: maxLimit, after: lastId });
            if (users.size === 0) return allUsers;

            const lastUser = users.last();
            allUsers.push(...Array.from(users.values())); // NOTE: this is kinda stinky i dont like it
            lastId = lastUser.id;

            if (users.size < maxLimit)
                return allUsers;
        }
    }
    /**
     * Resolves a mention like <@id> or a user ID into a User
     * @param {string} wrappedId <@id> or id
     * @returns {Promise<discord.User?>}
     */
    static async resolveMention(userIdOrWrapped) {
        userIdOrWrapped = String(userIdOrWrapped).trim();
        if (userIdOrWrapped.startsWith('<@') && userIdOrWrapped.endsWith('>')) {
            userIdOrWrapped = userIdOrWrapped.substring(2, userIdOrWrapped.length - 1);
        }

        if (!userIdOrWrapped) return;
        if (userIdOrWrapped === "0") return;
        if (userIdOrWrapped === "NaN") return;
        
        // NOTE: Discord IDs cant be represented in a number but they should still be a valid number
        if (isNaN(Number(userIdOrWrapped)))
            return;

        try {
            return await BotState.client.users.fetch(userIdOrWrapped);
        } catch {
            return;
        }
    }
    /**
     * Resolves a Discord or Unicode emoji's information if valid.
     * Discord emojis will be animated or static with an ID, and Unicode emojis will not have an ID but are returned in `emoji`.
     * @param {string} emoji Emoji 
     * @returns {{ type:"animated"|"static"|"unicode", emoji:string?, id:string? }|null} Emoji information if available
     */
    static resolveEmoji(emoji) {
        if (!emoji) return;
        const customMatch = emoji.match(/<(a|):[a-z0-9_\-]+:(\d+)>/i) || emoji.match(/^(\d+)$/);
        if (customMatch) {
            const id = customMatch[2] || customMatch[1];
            const emojiData = BotState.client.emojis.cache.get(id);
            if (!emojiData) return null;

            return {
                type: emojiData.animated ? "animated" : "static",
                emoji: null,
                id: emojiData.id
            };
        }

        const unicodeRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;
        if (unicodeRegex.test(emoji)) {
            return {
                type: "unicode",
                emoji: emoji,
                id: null
            };
        }

        return null;
    }

    static automodAllows(text, optCheckBypass, optReturnWord) {
        text = String(text)
            .toLowerCase()
            .replaceAll(' ', '')
            .replaceAll('\n', '')
            .replaceAll('\r', '');

        if (optCheckBypass) {
            text = text.split("").map(bypass.getRealCharacter).join("");
        }

        for (const keyword of automodKeywords) {
            if (text.includes(keyword)) {
                if (optReturnWord) {
                    return keyword;
                }
                return false;
            }
        }

        if (optReturnWord) {
            return;
        }
        return true;
    }

    static extractInviteShorteners(messageContent = '') {
        // this only matches invite shorteners, not discord.com, discord.gg, etc
        const shortenerRegex = /(https?:\/\/)(www\.)?(r\.)?(dsc\.gg\/?|dsc\.com\/invite)\/[^\s\/]+/gmi;

        const matches = messageContent.match(shortenerRegex);
        return matches || []; // no matches will return null
    }
    static containsInviteShorteners(messageContent = '') {
        const shorteners = this.extractInviteShorteners(messageContent);
        return shorteners.length > 0;
    }
    static extractInvites(messageContent = '', options = {
        includeShorteners: false,
        inviteCodes: false,
    }) {
        // includeShorteners will use shortenerRegex, which also matches dsc.gg and r.dsc.gg
        const nonShortenerRegex = /(https?:\/\/)?(www\.)?((discord\.(gg|io|me|li))|((discordapp|discord)\.com\/invite))(\/invite|)\/[^\s\/]+/gmi;
        const shortenerRegex = /(https?:\/\/)?(www\.)?(((r\.|)(discord|dsc)\.(gg|io|me|li))|((discordapp|discord|dsc)\.com\/invite))(\/invite|)\/[^\s\/]+/gmi;

        // no matches will return null
        const matches = messageContent.match(options.includeShorteners ? shortenerRegex : nonShortenerRegex) || [];
        return options.inviteCodes ? matches.map(url => url.split('/').pop()) : matches;
    }
    static containsInvite(messageContent = '', options = { includeShorteners: false }) {
        const invites = this.extractInvites(messageContent, options);
        return invites.length > 0;
    }
}

module.exports = DiscordUtility;
