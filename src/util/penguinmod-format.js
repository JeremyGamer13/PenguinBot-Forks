const discord = require("discord.js");

const PenguinModClient = require("./penguinmod-client.js");

class PenguinModFormat {
    /**
     * @typedef {Object} EmbedProjectOptions
     * @property {boolean} unknown Whether or not to show a warning to report the project.
     */
    /**
     * Formats a PenguinMod project into a Discord MessageEmbed.
     * @param {PenguinModTypes.Project} project The PenguinMod project to format into an embed.
     * @param {EmbedProjectOptions?} options Any options to configure the embed display.
     * @returns {discord.MessageEmbed}
     */
    static embedProject(project, options = {}) {
        const extraFlags = [];
        const embed = new discord.MessageEmbed();
        embed.setTitle(project.title);
        embed.setColor("#00c3ff");

        // add URL and image
        embed.setURL(`https://studio.penguinmod.com/#${project.id}`);
        embed.setImage(PenguinModClient.projects.getProjectThumbnailURL(project.id));

        // add fields
        embed.addFields([{
            name: "Stats",
            value: `❤️ ${Number(project.loves || 0)}`
                + " | " + `⭐ ${Number(project.votes || 0)}`
                + " | " + `👁️ ${Number(project.views || 0)}`
        }]);

        // add date
        if (project.lastUpdate || project.date)
            embed.setTimestamp(project.lastUpdate ? project.lastUpdate : project.date);

        if (options.unknown)
            embed.setFooter({ text: `Make sure to report inappropriate/offensive content!` });

        // author if given by the endpoint & not banned
        if (project.author && typeof project.author === "object" && !project.author.banned) {
            embed.setAuthor({
                name: project.author.username,
                url: `https://penguinmod.com/profile?user=${project.author.username}`,
                iconURL: PenguinModClient.users.getPfpUrl(project.author.username),
            });
        }

        // set extra flags
        if (project.remix && String(project.remix) !== "0") {
            extraFlags.push(`<:greenright:1179996859612282932> [This project is a remix.](https://studio.penguinmod.com/#${project.remix})`);
            embed.setColor("#00ff00");
        }
        if (project.featured) {
            extraFlags.push('<:favorite:1158864719764017212> This project is featured!');
            embed.setColor("#ffcc00");
        }

        // set description based on extra flags
        const fullText = `${project.instructions || ""}\n\n${project.notes || ""}`.trim();
        const fullTextToolong = fullText.length > 512;
        const extraFlagsText = extraFlags.map(value => (`**${value}**`)).join('\n');
        const descriptionClipped = fullTextToolong ? fullText.substring(0, 512 - 3) + '...' : fullText.substring(0, 512);
        const description = `${descriptionClipped}\n\n${extraFlagsText}`.trim();
        embed.setDescription(description);
        return embed;
    }
}

module.exports = PenguinModFormat;