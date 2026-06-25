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
        this.name = "tamper";
        this.description = "Corrupt a video or audio file a certain amount";
        this.attributes = {
            unlisted: false,
            lockedToCommands: true,
            numberConversion: true,
            permission: 0,
        };

        this.example = [
            { text: "{{prefix}}tamper 15" },
            { text: "{{prefix}}tamper 50" },
            { text: "{{prefix}}tamper 100" },
            { text: "{{prefix}}tamper 100 noStutter" },
        ];
    }

    async handle(message, args, util) {
        // get attachements
        const attachment = message.attachments.first();
        if (!attachment) throw new Error("Add an Video or audio");
        const endingType = util.getAttachmentType(attachment);
        if (!FFmpegUtil.isCompatibleVideo(endingType) && !FFmpegUtil.isCompatibleAudio(endingType)) throw new Error('Please use a valid video or audio format.');
        // check atachemtn size
        if (attachment.size > 15 * 1e+6) throw new Error("Files must be below 15 MB.");
        // level
        const tamperLevel = 1 - (Number(args[0]) / 100);
        const useStuttering = args[1] !== "noStutter";
        if (isNaN(tamperLevel) || !isFinite(tamperLevel)) throw new Error("Thats not a percentage");
        if (tamperLevel < 0 || tamperLevel > 1) throw new Error("Thats not in the range");

        // actually start doing stuff
        const startTime = Date.now();
        const jobName = TempFolder.makeTempName("tamper");
        const temporaryFolder = new TempFolder(jobName);
        await temporaryFolder.createAndDestroy(async (tempDir) => {
            // download
            const replyMessage = await message.reply("Downloading contents...");
            const [rawInputPath] = await downloadAttachments([attachment], (i) => `input${i}.${endingType}`, tempDir);
            // check ttype
            const isVideo = await FFmpegUtil.probe.isVideo(rawInputPath);
            const safeFileType = isVideo ? "mp4" : "ogg";
            // convert to safe type
            await replyMessage.edit("Converting contents...");
            const inputPath = path.join(tempDir, `inputsafe.${safeFileType}`);
            if (isVideo) await FFmpegUtil.commands.convertToSafeMp4(rawInputPath, inputPath);
            else await FFmpegUtil.commands.convertToSafeOgg(rawInputPath, inputPath);

            // generate, audio first  (since it's less file size)
            // add effects depending on the level
            // remember tamperLevel is closer to 1 for more pure.
            const audioEffects = [];
            if (tamperLevel <= 0.75) audioEffects.push(FFmpegUtil.builders.audioEcho(1, 1, 10, 1));

            if (tamperLevel <= 0.50) audioEffects.push(FFmpegUtil.builders.audioEcho(1, 1, 15, 1));
            if (tamperLevel <= 0.50) audioEffects.push(FFmpegUtil.builders.audioVolume(0.6));

            if (tamperLevel <= 0.25) audioEffects.push(FFmpegUtil.builders.audioEcho(1, 1, 20, 1));
            if (tamperLevel <= 0.25) audioEffects.push(FFmpegUtil.builders.audioVolume(0.6));

            if (tamperLevel <= 0.15) audioEffects.push(FFmpegUtil.builders.audioEcho(1, 1, 25, 1));
            if (tamperLevel <= 0.15) audioEffects.push(FFmpegUtil.builders.audioVolume(0.6));

            if (tamperLevel <= 0.05) audioEffects.push(FFmpegUtil.builders.audioEcho(1, 1, 30, 1));
            if (tamperLevel <= 0.05) audioEffects.push(FFmpegUtil.builders.audioVolume(0.6));

            const outputPathEffects = path.join(tempDir, `echo.${safeFileType}`);
            await replyMessage.edit("Adding effects to the audio stream");
            await FFmpegUtil.commands.useBuilderAudioFilter(inputPath, audioEffects, outputPathEffects);

            // stutter the audio
            let finalFileOutput = outputPathEffects;
            if (useStuttering) {
                // settings for the stutters. remember tamperLevel is closer to 1 for more pure.
                const stutterLoopCount = Math.round(2 + (14 * (1 - tamperLevel))); // how many loops in a stutter (2-16)
                const stutterLength = 0.5; // how long the whole stutter should be
                const stutterLoopLength = stutterLength / stutterLoopCount;
                const videoLength = await FFmpegUtil.probe.length(inputPath);

                // add the timestamps for each stutter.
                // this allows for barely any stutters on more pure videos, and more stutters on less pure videos
                let stutterNext = stutterLength + ((tamperLevel * videoLength) / 2);
                const stuttersAt = [];
                while (stutterNext < videoLength && (stutterNext + stutterLength) < videoLength) {
                    stuttersAt.push(stutterNext);

                    stutterNext += stutterLength * 2; // we can't overlap them well
                    stutterNext += tamperLevel * videoLength;
                }

                // actually do the stutters
                const scriptPathStutter = path.join(tempDir, `stutterscript.txt`);
                const outputPathStuttered = path.join(tempDir, `stuttered.${safeFileType}`);
                await replyMessage.edit("Stuttering the audio stream");
                await FFmpegUtil.commands.stutter(outputPathEffects, scriptPathStutter, outputPathStuttered, stutterLoopCount, stutterLoopLength, stuttersAt);
                finalFileOutput = outputPathStuttered;
            }

            // if video then we need to tamper & compress
            if (isVideo) {
                // tamper with the video
                const outputPathTampered = path.join(tempDir, `tampered.${safeFileType}`);
                await replyMessage.edit("Tampering with the video stream");
                await FFmpegUtil.commands.tamper(finalFileOutput, outputPathTampered, tamperLevel);

                // compress
                const compressTarget = 4 * 1e+6; // 4mb
                const outputPathCompressed = path.join(tempDir, `tampered_compressed.${safeFileType}`);
                await replyMessage.edit("Compressing tampered video to 4 MB... (normal remuxing might be too big)");
                await FFmpegUtil.commands.dynamicallyCompressToMp4(outputPathTampered, outputPathCompressed, compressTarget);
                finalFileOutput = outputPathCompressed;
            }

            await replyMessage.edit({
                content: "Completed in " + ((Date.now() - startTime) / 1000) + " seconds"
                    + "\n" + `-# Generated by <@${message.author.id}>`,
                files: [finalFileOutput]
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