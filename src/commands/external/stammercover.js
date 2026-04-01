const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const env = require("../../util/env-util");
const Demucs = require('../../util/demucs');
const Stammer = require('../../util/stammer');
const getFileSize = require('../../util/file-size');
const FFmpegUtil = require('../../util/ffmpeg-util');
const TempFolder = require('../../util/temp-folder');
const downloadAttachments = require('../../util/download-attachments');

class Command {
    constructor() {
        this.name = "stammercover";
        this.description = "Lalala my epic YTPmv but its REALLY BAD and SUCKS";
        this.attributes = {
            unlisted: false,
            lockedToCommands: true,
            numberConversion: true,
            permission: 0,
        };
    }

    getAttachments(message, args, util) {
        // check attachements
        const attachment1 = message.attachments.first();
        const attachment2 = message.attachments.last();
        if (!attachment1) throw new Error("Add an video or audio to take the frames/source from");
        if (!attachment2) throw new Error("Add an video or audio to cover the voice of");
        const endingTypeRaw1 = util.getAttachmentType(attachment1);
        const endingTypeRaw2 = util.getAttachmentType(attachment2);
        if (!FFmpegUtil.isCompatibleVideo(endingTypeRaw1) && !FFmpegUtil.isCompatibleAudio(endingTypeRaw1))
            throw new Error('Please use a valid video or audio format. (video 1)');
        if (!FFmpegUtil.isCompatibleVideo(endingTypeRaw2) && !FFmpegUtil.isCompatibleAudio(endingTypeRaw2))
            throw new Error('Please use a valid video or audio format. (video 2)');
        // check atachemtn size
        if (attachment1.size > 15 * 1e+6) throw new Error("Files must be below 15 MB.");
        if (attachment2.size > 15 * 1e+6) throw new Error("Files must be below 15 MB.");
        return [attachment1, attachment2];
    }
    async handle(message, args, util) {
        const [attachment1, attachment2] = this.getAttachments(message, args, util);

        let secondsPerFrame = args[0] || 0.016;
        if (typeof secondsPerFrame !== "number") secondsPerFrame = 0.016;
        secondsPerFrame = Math.min(Math.max(secondsPerFrame, 0.016), 60);

        // actually start doing stuff
        const startTime = Date.now();
        const jobName = TempFolder.makeTempName("stammercover");
        const temporaryFolder = new TempFolder(jobName);
        await temporaryFolder.createAndDestroy(async (tempDir) => {
            // download
            const replyMessage = await message.reply("Downloading contents...");
            const [rawPath1, rawPath2] = await downloadAttachments([attachment1, attachment2], (i) => `input${i}.bin`, tempDir);
            // convert to safe types (path2 will always be an audio file)
            await replyMessage.edit("Converting contents...");
            const path1 = await FFmpegUtil.convertToSafeVideoOrAudio(rawPath1, (fileType) => path.join(tempDir, `inputsafe1.${fileType}`));
            const path2 = path.join(tempDir, `inputsafe2.ogg`);
            await FFmpegUtil.convertToSafeOgg(rawPath2, path2);
            // check length
            const length1 = await FFmpegUtil.probeLength(path1);
            const length2 = await FFmpegUtil.probeLength(path2);
            if (length1 > 5 * 60) return replyMessage.edit("Files must be within 5 minutes long OR you can buy me 64 gigabytes of ram 🎉");
            if (length2 > 5 * 60) return replyMessage.edit("Files must be within 5 minutes long OR you can buy me 64 gigabytes of ram 🎉");

            // DEMUCS
            // split the audio
            await replyMessage.edit(`Splitting audio (${attachment2.name}) with demucs...`);
            const [outputPathInst, outputPathVocals] = await Demucs.splitVocals(path2, tempDir);

            // STAMMER
            // generate
            const finalExt = `${path.extname(path1)}`;
            const isVideo = await FFmpegUtil.probeIsVideo(path1);
            await replyMessage.edit(`Generating stammer output... (seconds per frame: ${secondsPerFrame})`
                + `\n` + `(SOURCE: ${attachment1.name}, MODIFIER: ${attachment2.name} (VOCALS ONLY))`
                + `\n` + `will output as ${isVideo ? "video" : "audio"}`);

            const outputStammerPath = path.join(tempDir, `outputstammer.${finalExt}`);
            await Stammer.process(path1, outputPathVocals, outputStammerPath, secondsPerFrame);

            // BRANCH HERE: ok so we ahave Demucs split and stammer split but we actually need to do 2 different things based on this
            let finalOutputPath = null;
            // If we are video then we need to do the mixing step in compression
            if (isVideo) {
                // compress
                const compressTarget = 8 * 1e+6; // 8mb
                const currentSizeBytes = await getFileSize(outputStammerPath);
                await replyMessage.edit(`Compressing and merging instrumental with output; target ~${compressTarget / 1e+6}mb (currently ${currentSizeBytes / 1e+6}mb)`);

                const outputCompressedPath = path.join(tempDir, `compressedoutput.${finalExt}`);
                await FFmpegUtil.dynamicallyCompressToMp4WithBackingTrack(outputStammerPath, outputPathInst, outputCompressedPath, compressTarget);
                finalOutputPath = outputCompressedPath;
            }
            // If we are audio then we merge the audio now, and convert to ogg
            else {
                // merge audio
                const outputMixedPath = path.join(tempDir, `mixedaudio.${finalExt}`);
                await replyMessage.edit(`Mixing instrumental with stammer vocals`);
                await FFmpegUtil.mixAudio(outputStammerPath, outputPathInst, outputMixedPath);

                // convert to ogg
                // ok now we convert that to ogg because its too big
                await replyMessage.edit("Converting to OGG... (because wav files are Fat)");
                const outputPathOgg = path.join(tempDir, "mixedstammer.ogg");
                await FFmpegUtil.convertToSafeOgg(outputMixedPath, outputPathOgg);
                finalOutputPath = outputPathOgg;
            }

            // ok we did everyting
            await replyMessage.edit({
                content: "Completed in " + ((Date.now() - startTime) / 1000) + " seconds"
                    + "\n" + `-# Generated by <@${message.author.id}>`,
                files: [finalOutputPath]
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