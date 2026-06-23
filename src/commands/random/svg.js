const configuration = require("../../config");

const makePng = require("../../util/make-png");
const svgRepair = require("../../util/svg-repair");
const isCompatibleImage = require("../../util/compatible-images");

class Command {
    constructor() {
        this.name = "svg";
        this.description = "render svg as png";
        this.attributes = {
            permission: 0,
        };
    }

    async invoke(message, args, util) {
        // get user input
        const attachment = message.attachments.first();
        if (!attachment) return message.reply("add na Svgs to your message 2492941>");
        if (attachment.size > 5 * 1024 * 1024) return message.reply("Holy shit that's a fucking huge image");
        const imageType = util.getAttachmentType(attachment);
        if (!isCompatibleImage(imageType)) return message.reply("Are you fucking stupid");
        if (!["svg", "svg+xml"].includes(imageType)) return message.reply("🫩✌️");

        // we just expect this to work because realistically the command shouldnt work if this doesnt
        const attachmentFetch = await fetch(attachment.url);
        const attachmentArrayBuffer = await attachmentFetch.arrayBuffer();
        const attachmentBuffer = Buffer.from(attachmentArrayBuffer);
        const attachmentString = attachmentBuffer.toString("utf8");
        if (!attachmentString.slice(0, 256).includes("<")) return message.reply("this shit is NOT an svg");

        // we need to parse this response
        try {
            const parsed = svgRepair(attachmentString);
            const image = await makePng(Buffer.from(parsed, "utf8"));
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