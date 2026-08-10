const fs = require("fs");
const path = require("path");

const env = require("../util/env-util.js");

class Command {
    constructor() {
        this.name = "sekaisticker";
        this.description = "Caption a sticker of a project sekai chibi.";
        this.attributes = {
            unlisted: true, // TODO: temp
            permission: 0,
            lockedToCommands: true,
        };

        this.alias = ["sekai", "pjsekai", "pjsekaisticker"];
        
        // initialize the stickers
        const sekaiPath = env.get("SEKAI_STICKERS_PATH");
        this.sekaiPath = sekaiPath;
        this.configured = !!sekaiPath;
        if (this.configured) {
            const stickersJsonPath = path.join(sekaiPath, "src/characters.json");
            this.stickers = JSON.parse(fs.readFileSync(stickersJsonPath, "utf8"));

            // list of valid chars
            this.colors = {};
            this.characters = new Set();
            for (const sticker of stickers) {
                if (this.characters.has(sticker.character))
                    continue;
                this.characters.add(sticker.character);
                this.colors[sticker.character] = sticker.color;
            }
        }
    }

    async invoke(message, args, util) {
        // see if they provided a custom image
        let customBuffer = null;
        if (message.attachments.first()) {
            // use the helper if they added an attachment (otherwise the helper will use customs
            // when we dont want to, like if we were replying to other users)
            [customBuffer] = util.getInputImagesForCommand(message);
            if (!customBuffer) return;
        }

        // error if we have no image to use
        if (!customBuffer && !this.configured)
            throw new Error("SEKAI_STICKERS_PATH is not configured on this system");

        // if we are using a custo  char, the text color is args[0];
        const characterName = customBuffer ? "custom" : args[0];
        const characterColor = customBuffer ? args[0] : this.colors[characterName];
        if (!customBuffer && this.characters.has(characterName))
            return message.reply("That's not a valid character. See the help for this command.");
        if (!characterColor)
            return message.reply("TODO: thiouwehdn");
        
        // we just expect this to work because realistically the command shouldnt work if this doesnt
        const attachmentFetch = await fetch(attachment.url);
        const attachmentString = await attachmentFetch.text();
        if (!attachmentString.slice(0, 128).includes("<")) return message.reply("That doesn't look like an SVG.");

        // attempt rendering
        try {
            const repaired = svgRepair(attachmentString);
            const image = await svgRender(repaired, renderDpi);
            message.reply({
                content: `Displayed by <@${message.author.id}>`,
                files: [image],
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        } catch (err) {
            message.reply({
                content: `Failed to render, even after repairing your SVG: ${err}`.substring(0, 2000),
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

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;