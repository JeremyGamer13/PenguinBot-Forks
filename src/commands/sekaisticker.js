const fs = require("fs/promises");
const path = require("path");

const discord = require("discord.js");
const cssColor = require("@asamuzakjp/css-color");

const jimp = require("jimp");
const { Jimp, JimpMime } = jimp;
const { Canvas, FontLibrary } = require("skia-canvas");

const env = require("../util/env-util.js");
const tryCatch = require("../util/try-catch.js");

class Command {
    constructor() {
        this.name = "sekaisticker";
        this.description = "Caption a sticker of a Project SEKAI chibi.";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
        };

        this.alias = ["sekai", "pjsekai", "pjsekaisticker"];

        // we cant await but hopefully this finishes
        this.loading = true;
        this.initialize().finally(() => {
            this.loading = false;
        });
    }
    async initialize() {
        // initialize the stickers
        const sekaiPath = env.get("SEKAI_STICKERS_PATH");
        this.sekaiPath = sekaiPath;
        this.configured = !!sekaiPath;
        if (!this.configured) return;

        const stickersJsonPath = path.join(sekaiPath, "src/characters.json");
        const stickersJsonStr = await fs.readFile(stickersJsonPath, "utf8");
        const stickers = JSON.parse(stickersJsonStr);

        // list of valid chars & sticker variants
        this.colors = {};
        this.stickers = {};
        this.characters = new Set();
        for (const sticker of stickers) {
            const characterName = `${sticker.character}`.toLowerCase().replace(/\s/g, "").trim();
            if (!this.characters.has(characterName))
                this.characters.add(characterName);
            this.colors[characterName] = sticker.color;

            // add sticker to list
            const stickerList = this.stickers[characterName] || [];
            stickerList.push(sticker);
            this.stickers[characterName] = stickerList;
        }

        // load the woff2 fonts
        FontLibrary.use("YurukaStd", [path.join(sekaiPath, "src/fonts/YurukaStd.woff2")]);
        FontLibrary.use("SSFangTangTi", [path.join(sekaiPath, "src/fonts/ShangShouFangTangTi.woff2")]);

        // make the long description from the list of characters
        this.descriptionLong = "Caption a sticker of a Project SEKAI chibi."
            + "\n" + "Either specify a character's name, or attach your own image to caption."
            + "\n" + "When captioning your own image, provide a hex color rather than a character name."
            + "\n" + "The valid characters are:" + " " + Array.from(this.characters.values()).map(name => `\`${name}\``).join(", ");
    }

    async invoke(message, args, util) {
        if (this.loading)
            return message.reply("The command is busy loading.");

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

        // vaildate the text
        const textToSay = `${args.join(" ")}`;
        if (!util.request("isInPersonalMode") && util.getPermissionLevel(message) < 4 && !util.automodAllows(textToSay, true))
            return message.reply("I can't render that caption. Enter something else.");

        // load everything we need to render this stickker
        const customSticker = {
            color: characterColor,
            defaultText: {
                text: textToSay,
                x: 148,
                y: 42,
                r: -1,
                s: 47
            }
        };
        const stickersPossible = this.stickers[characterName];
        const stickerInfo = customBuffer ? customSticker
            : stickersPossible[Math.round(Math.random() * (stickersPossible.length - 1))];
        let stickerInputBuffer = customBuffer;
        if (!stickerInputBuffer)
            stickerInputBuffer = await fs.readFile(path.join(this.sekaiPath, "public/img/", stickerInfo.img));
        
        // render the text we need to draw. we make this a big blank space and then crop it later for rotation
        // https://github.com/TheOriginalAyaka/sekai-stickers/blob/main/src/App.jsx
        const stickerTextCanvas = new Canvas(296, 256);
        const stickerTextCtx = stickerTextCanvas.getContext("2d");
        stickerTextCtx.lineWidth = 9;
        stickerTextCtx.textAlign = "center";
        stickerTextCtx.strokeStyle = "white";
        stickerTextCtx.fillStyle = characterColor;

        // place  & draw the text
        stickerTextCtx.translate(stickerInfo.defaultText.x, stickerInfo.defaultText.y);
        stickerTextCtx.rotate(stickerInfo.defaultText.r / 10);

        // since jsb doesnt have precise controls this just does all the font sizing for the user
        const textSplit = textToSay.split("\n");
        for (let i = 0, space = 0; i < textSplit.length; i++) {
            const textLineToSay = textSplit[i];

            // start at 32 and scale down from there
            let fontSize = 32;
            stickerTextCtx.font = `${fontSize}px YurukaStd, SSFangTangTi`;

            // scale down, we use stroke width & just arbitraruiily round up to 12 lol
            const metrics = stickerTextCtx.measureText(textLineToSay);
            const maxTextWidth = stickerTextCanvas.width - 12;
            if (metrics.width > maxTextWidth) {
                const scale = maxTextWidth / metrics.width;
                fontSize = Math.floor(fontSize * scale);
            }

            // draw tthat
            stickerTextCtx.font = `${fontSize}px YurukaStd, SSFangTangTi`;
            stickerTextCtx.strokeText(textLineToSay, 0, space);
            stickerTextCtx.fillText(textLineToSay, 0, space);
            space += fontSize * 1.25;
        }

        // render the sticker image
        // other makers seem to use this sizing
        const stickerTextJimp = await Jimp.fromBuffer(await stickerTextCanvas.toBuffer("png"));
        const stickerImage = await Jimp.fromBuffer(stickerInputBuffer);
        stickerImage.contain({ w: 296, h: 256 });
        stickerImage.composite(stickerTextJimp, 0, 0);

        // Convert the canvas to a Discord attachment
        const stickerBuffer = await stickerImage.getBuffer(JimpMime.png);
        const attachment = new discord.MessageAttachment(stickerBuffer, 'sticker.png');
        message.reply({
            content: `Generated by <@${message.author.id}>`,
            files: [attachment]
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;