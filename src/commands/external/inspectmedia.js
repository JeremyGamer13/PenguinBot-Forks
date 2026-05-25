const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const env = require("../../util/env-util");
const getFileSize = require('../../util/file-size');
const FFmpegUtil = require('../../util/ffmpeg-util');
const TempFolder = require('../../util/temp-folder');
const downloadAttachments = require('../../util/download-attachments');

class Command {
    constructor() {
        this.name = "inspectmedia";
        this.description = "debug command";
        this.attributes = {
            unlisted: true,
            lockedToCommands: true,
            permission: 0,
        };
    }

    async handle(message, args, util) {
        // get attachements
        const attachment = message.attachments.first();
        if (!attachment) throw new Error("Add an Media to check");
        const endingType = util.getAttachmentType(attachment);
        if (!FFmpegUtil.isCompatibleAudio(endingType) && !FFmpegUtil.isCompatibleVideo(endingType)) throw new Error('Please use a valid audio or video format.');
        // check atachemtn size
        if (attachment.size > 15 * 1e+6) throw new Error("Files must be below 15 MB.");

        // actually start doing stuff
        const startTime = Date.now();
        const jobName = TempFolder.makeTempName("inspectmedia");
        const temporaryFolder = new TempFolder(jobName);
        await temporaryFolder.createAndDestroy(async (tempDir) => {
            // download
            const replyMessage = await message.reply("Downloading contents...");
            const [rawInputPath] = await downloadAttachments([attachment], (i) => `input${i}.${endingType}`, tempDir);
            // check length
            const length = await FFmpegUtil.probe.length(rawInputPath);
            const isVideo = await FFmpegUtil.probe.isVideo(rawInputPath);

            await replyMessage.edit({
                content: "Currently looking at `" + attachment.name + "`"
                    + "\n" + `- Length: ${length}`
                    + "\n" + `- isVideo: ${isVideo}`
                    + "\n" + `- Downloaded path: \`${rawInputPath}\``
                    + "\n" + `-# inspected by <@${message.author.id}>`
            });
        });
    }
    async invoke(message, args, util) {
        const canDo = util.request("heavyExternalStuff");
        if (!canDo) return message.reply("disabled (im probably playing a game)");

        await this.handle(message, args, util);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;