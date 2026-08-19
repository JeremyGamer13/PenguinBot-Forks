const fs = require("fs/promises");
const path = require("path");
const childProcess = require("child_process");

const env = require("../../../util/env-util");
const Demucs = require('../../../util/demucs');
const FFmpegUtil = require('../../../util/ffmpeg-util');
const TempFolder = require('../../../util/temp-folder');
const downloadAttachments = require('../../../util/download-attachments');

class Command {
    constructor() {
        this.name = "pitchstems";
        this.description = "Repitch every stem in an audio thing to something probably worse";
        this.descriptionLong = "Repitch every stem in an audio thing to something probably worse"
            + "\n" + "Attach an audio clip and itll be split into 6 stems:"
                + " " + "drums, bass, \"other\", guitar, piano (dirty), vocals"
            + "\n" + "You can then repitch each stem using `(stem)=(semitones)`"
            + "\n" + "Semitones is either a number or `random` for -12 to +12"
            + "\n" + "Then they will all be mixed together again";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };

        this.example = [
            { text: "{{prefix}}pitchstems vocals=12" },
            { text: "{{prefix}}pitchstems bass=12 guitar=3 vocals=-6" },
        ];
        this.alias = ["pitchstem", "stempitch", "stemspitch", "repitchstems", "repitchstem", "stemrepitch", "stemsrepitch"];
    }

    async handle(message, args, util) {
        // get attachements
        const attachment = message.attachments.first();
        if (!attachment) throw new Error("Add an Audio to  repitch");
        const endingType = util.getAttachmentType(attachment);
        if (!FFmpegUtil.isCompatibleAudio(endingType)) throw new Error('Please use a valid audio format.');
        // check atachemtn size
        if (attachment.size > 15 * 1e+6) throw new Error("Files must be below 15 MB.");

        // convert the args into acutal operations
        const operations = {
            drums: 0,
            bass: 0,
            other: 0,
            guitar: 0,
            piano: 0,
            vocals: 0,
        };
        for (const arg of args) {
            const split = arg.split("=");
            const target = String(split[0]).toLowerCase();
            const value = Number(split[1] === "random" ? Math.round(Math.random() * 24) - 12 : split[1]);
            if (isNaN(value) || !isFinite(value))
                throw new Error("One of your semitone values is invalid");
            switch (target) {
                case "drums":
                case "bass":
                case "other":
                case "guitar":
                case "piano":
                case "vocals":
                    operations[target] = Number(value);
                    break;
                default:
                    throw new Error("Choose a valid stem to target: `drums`, `bass`, `other`, `guitar`, `piano`, `vocals`");
            }
        }

        // actually start doing stuff
        const startTime = Date.now();
        const jobName = TempFolder.makeTempName("pitch");
        const temporaryFolder = new TempFolder(jobName);
        await temporaryFolder.createAndDestroy(async (tempDir) => {
            // download
            const replyMessage = await message.reply("Downloading contents...");
            const [rawInputPath] = await downloadAttachments([attachment], (i) => `input${i}.bin`, tempDir);
            console.log(rawInputPath);
            // convert to safe type
            await replyMessage.edit("Converting contents...");
            const inputPath = path.join(tempDir, `inputsafe.ogg`);
            await FFmpegUtil.commands.convertToSafeOgg(rawInputPath, inputPath);
            // check length
            const length = await FFmpegUtil.probe.length(inputPath);
            if (length > 10 * 60) return replyMessage.edit("Files must be within 10 minutes long OR you can buy me 64 gigabytes of ram 🎉");

            // generate
            await replyMessage.edit("Splitting audio into 6 stems with demucs...");
            const [
                outputPathDrums,
                outputPathBass, 
                outputPathOther, 
                outputPathGuitar, 
                outputPathPiano, 
                outputPathVocals
            ] = await Demucs.split6Stems(inputPath, tempDir);

            // do the operations
            await replyMessage.edit(`doing all the stem changes...`);
            for (const stemName in operations) {
                const semitones = operations[stemName];
                if (semitones === 0) continue;

                // we need to actually change something
                const pathToModify = stemName === "drums" ? outputPathDrums
                    : (stemName === "bass" ? outputPathBass
                    : (stemName === "other" ? outputPathOther
                    : (stemName === "guitar" ? outputPathGuitar
                    : (stemName === "piano" ? outputPathPiano
                    : outputPathVocals))));
                
                // ffmpeg cant edit an audio file in place so we need to make a temp file
                const outputTemporaryPath = path.join(tempDir, `temporary_stem_change.ogg`);
                await fs.copyFile(pathToModify, outputTemporaryPath);

                // DISCLOSURE: this one line is ai calculate octave change factor from semitones
                const octaveChange = Math.pow(2, semitones / 12);
                await FFmpegUtil.commands.changePitch(pathToModify, outputTemporaryPath, octaveChange);

                // now copy the temporary path onto the output
                await fs.copyFile(outputTemporaryPath, pathToModify);
            }

            // mix the s
            await replyMessage.edit("mixing all your shitty changes together");
            const outputMixedPath = path.join(tempDir, `repitch_mixed.ogg`);
            await FFmpegUtil.commands.mixAudioAll(
                // output
                outputMixedPath, 
                // inputs
                outputPathDrums,
                outputPathBass,
                outputPathOther,
                outputPathGuitar,
                outputPathPiano,
                outputPathVocals,
            );

            // make louder
            const outputMixedLouderPath = path.join(tempDir, `repitch_mixed_louder.ogg`);
            await FFmpegUtil.commands.adjustVolume(outputMixedPath, outputMixedLouderPath, 2);

            // done
            await replyMessage.edit({
                content: "Completed in " + ((Date.now() - startTime) / 1000) + " seconds"
                    + "\n" + `-# Generated by <@${message.author.id}>`,
                files: [outputMixedLouderPath]
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