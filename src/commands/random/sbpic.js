const configuration = require("../../config");

const drawSBPic = require('../../util/sbpic');
const jsonParseLoose = require("../../util/json-parse-loose.js");
const SchemaSBPicGeneration = require('../../resources/schemas/sbpic-gen.json');

class Command {
    constructor() {
        this.name = "sbpic";
        this.description = "render sbpic json (stream bot pictures used by jg!draw)";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
        };
    }

    async invoke(message, args, util) {
        // get user input
        const attachment = message.attachments.first();
        if (!attachment) return message.reply("add na jsoon to your message 2492941>");
        if (attachment.size > 64 * 1000) return message.reply("Holy shit that's a fucking huge image");

        // we just expect this to work because realistically the command shouldnt work if this doesnt
        const attachmentFetch = await fetch(attachment.url);
        const attachmentArrayBuffer = await attachmentFetch.arrayBuffer();
        const attachmentBuffer = Buffer.from(attachmentArrayBuffer);
        const attachmentString = attachmentBuffer.toString("utf8");

        // we need to parse this response
        const parsed = jsonParseLoose(attachmentString);
        if (parsed.w <= 0 || parsed.w > 4096) return message.reply("No");
        if (parsed.h <= 0 || parsed.h > 4096) return message.reply("No");
        const image = drawSBPic(parsed);
        message.reply({
            content: `Displayed by <@${message.author.id}>`
                + (parsed.desc ? (`\n` + `-# ${parsed.desc.trim().substring(0, 1024)}`) : ""),
            files: [image],
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;