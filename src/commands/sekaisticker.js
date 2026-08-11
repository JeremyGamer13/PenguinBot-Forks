const fs = require("fs");
const path = require("path");

const cssColor = require("@asamuzakjp/css-color");
const { Jimp, JimpMime } = require("jimp");

const env = require("../util/env-util.js");
const tryCatch = require("../util/try-catch.js");

class Command {
    constructor() {
        this.name = "sekaisticker";
        this.description = "Caption a sticker of a Project SEKAI chibi.";
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
            const stickers = JSON.parse(fs.readFileSync(stickersJsonPath, "utf8"));

            // list of valid chars & sticker variants
            this.colors = {};
            this.stickers = {};
            this.characters = new Set();
            for (const sticker of stickers) {
                const characterName = `${sticker.character}`.toLowerCase().replace(/\s/g, "").trim();
                if (this.characters.has(characterName))
                    continue;
                this.characters.add(characterName);
                this.colors[characterName] = sticker.color;
                this.stickers[characterName] = sticker;
            }

            // make the long description from the list of characters
            this.descriptionLong = "Caption a sticker of a Project SEKAI chibi."
                + "\n" + "Either specify a character's name, or attach your own image to caption."
                + "\n" + "When captioning your own image, provide a hex color rather than a character name."
                + "\n" + "The valid characters are:" + " " + Array.from(this.characters.values()).map(name => `\`${name}\``).join(", ");
        }
    }

    async invoke(message, args, util) {
        // see if they provided a custom image
        let customBuffer = null;
        if (message.attachments.first()) {
            // use the helper if they added an attachment (otherwise the helper will use customs
            // when we dont want to, like if we were replying to other users)
            [customBuffer] = await util.getInputImagesForCommand(message);
            if (!customBuffer) return;
        }

        // error if we have no image to use
        if (!customBuffer && !this.configured)
            throw new Error("SEKAI_STICKERS_PATH is not configured on this system");

        // if we are using a custo  char, the text color is args[0];
        const characterName = customBuffer ? "custom" : args[0];
        const characterColor = tryCatch(() => cssColor.convert.colorToHex(customBuffer ? args[0] : this.colors[characterName]));
        if (!customBuffer && !this.characters.has(characterName))
            return message.reply("That's not a valid character. See the help for this command.");
        if (!characterColor)
            return message.reply("You need to provide a proper text color for custom images.");
        args.shift(); // remove the name or color arg

        // render the text we need to draw
        const textToSay = `${args.join(" ")}`;
        return message.reply("Not implemented");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;