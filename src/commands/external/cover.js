const fs = require("fs");
const path = require("path");
const discord = require("discord.js");
const childProcess = require("child_process");

const RVC = require('../../util/rvc');
const env = require("../../util/env-util");
const Demucs = require('../../util/demucs');
const FFmpegUtil = require('../../util/ffmpeg-util');
const TempFolder = require('../../util/temp-folder');
const downloadAttachments = require('../../util/download-attachments');

class Command {
    constructor(client) {
        this.name = "cover";
        this.description = "Jeremy gamer 14 will cover your song (ai cover)";
        this.attributes = {
            unlisted: true,
            adminInclusive: [
                '694587798598058004', // ddededodediamante
                '567307285324496897', // jwklong
            ],
            permission: 4,
        };

        this.client = client;
    }

    reject(message) {
        return message.reply("no");
    }

    async handle(message, args, util) {
        const speechMethodsAllowed = [
            // speech (def: normal)
            "normal", "robotic",
            // semitones (def: mid)
            "high", "raise", "mid", "drop", "low",
            // volume
            "louder", "quieter",
            // tracks (def: vocals)
            "instrumental", "vocals", "simultaneous"
        ];
        if (!args[0]) return message.reply(`listing methods, add \`normal\` to your message to silence:`
            + "\n" + `\`\`${speechMethodsAllowed.map(m => JSON.stringify(m)).join(", ")}\`\``
            + "\n" + `these can be added in sequence (however some overwrite others), the default is "normal" + "mid" (you might wanna use "low" for accuracy)`
            + "\n" + `note that ANY AUDIO you upload WILL BE SAVED for the bot to MANUALLY approve / deny so dont upload bad stuff`);
        if (args.length > 256) return message.reply("yo thats too many settings bro calm down you do not need allat");

        let aiSpeechMethod = "rmvpe";
        let aiSemitones = 0;
        let volumeAdjustment = 1;
        let tracksSelection = "vocals";
        for (const method of args) {
            if (!speechMethodsAllowed.includes(method)) return message.reply("Fuck are you talkin bout i cant do that");
            switch (method) {
                // speech
                case "normal":
                    aiSpeechMethod = "rmvpe";
                    break;
                case "robotic":
                    aiSpeechMethod = "crepe";
                    break;

                // semitones
                case "high":
                    aiSemitones += 12;
                    break;
                case "raise":
                    aiSemitones += 1;
                    break;
                case "mid":
                    aiSemitones = 0;
                    break;
                case "drop":
                    aiSemitones -= 1;
                    break;
                case "low":
                    aiSemitones -= 12;
                    break;

                // volume
                case "louder":
                    volumeAdjustment += 0.1;
                    break;
                case "quieter":
                    volumeAdjustment -= 0.1;
                    break;

                // tracks
                case "instrumental":
                    tracksSelection = "instrumental";
                    break;
                case "vocals":
                    tracksSelection = "vocals";
                    break;
                case "simultaneous":
                    tracksSelection = "simultaneous";
                    break;
            }
        }

        // get attachements
        const attachment = message.attachments.first();
        if (!attachment) throw new Error("Add an Audio to cover");
        const endingType = util.getAttachmentType(attachment);
        if (!FFmpegUtil.isCompatibleAudio(endingType)) throw new Error('Please use a valid audio format.');
        // check atachemtn size
        if (attachment.size > 8 * 1e+6) throw new Error("Files must be below 8 MB.");

        // actually start doing stuff
        const startTime = Date.now();

        const jobName = TempFolder.makeTempName("cover");
        const temporaryFolder = new TempFolder(jobName);
        await temporaryFolder.createAndDestroy(async (tempDir) => {
            // download
            const replyMessage = await message.reply("Your files being downloaded  hold on");
            const [rawInputPath] = await downloadAttachments([attachment], (i) => `input${i}.bin`, tempDir);
            console.log(rawInputPath);
            // convert to safe type
            await replyMessage.edit("Converting contents...");
            const inputPath = path.join(tempDir, `inputsafe.ogg`);
            await FFmpegUtil.commands.convertToSafeOgg(rawInputPath, inputPath);
            // check length
            const length = await FFmpegUtil.probe.length(inputPath);
            if (length > 5 * 60) return replyMessage.edit("Files must be within 5 minutes long OR you can buy me an NVIDIA RTX 4090 🎉");

            // see if we need approval
            if (message.guildId !== "746156168560508950") {
                await replyMessage.edit("# me and ishowspeed need to approve your audio"
                    + "\n" + "Please wait for your audio to be accepted."
                    + "\n" + "- You may be denied if im already processing a song (im too lazy to add a real queue thing)"
                    + "\n" + "- You may be denied if im not currently active or the bot is about to shut down for the day"
                    + "\n" + "- You may be denied if the audio has no vocals"
                    + "\n" + "- Genuinely offensive/inappropriate content will be denied AND result in a **permanent ban** from the server!");

                const requestDetails = `AI song cover request`
                    + `\n` + `Settings: \`\`${JSON.stringify(args)}\`\``
                const accepted = await util.requestApproval(replyMessage, message, requestDetails, [inputPath]);
                if (!accepted) return; // rejects will be handled by requestApproval
            }

            // generate
            let selectedTrack = tracksSelection === "simultaneous" ? inputPath : null;
            let backingTrack = null;
            if (!selectedTrack) {
                await replyMessage.edit("Continuing process, Splitting audio with demucs...");
                const [outputPathInst, outputPathVocals] = await Demucs.splitVocals(inputPath, tempDir);

                // convert to OGG for later when we merge them
                await replyMessage.edit("Converting to OGG... (because wav files are Fat)");
                const outputPathOggInst = path.join(tempDir, "instrumental.ogg");
                const outputPathOggVocals = path.join(tempDir, "vocals.ogg");
                await FFmpegUtil.commands.convertToSafeOgg(outputPathInst, outputPathOggInst);
                await FFmpegUtil.commands.convertToSafeOgg(outputPathVocals, outputPathOggVocals);

                if (tracksSelection === "instrumental") {
                    selectedTrack = outputPathOggInst;
                    backingTrack = outputPathOggVocals;
                } else {
                    selectedTrack = outputPathOggVocals;
                    backingTrack = outputPathOggInst;
                }
            }

            // have my AI voice cover it
            const outputPathAICover = path.join(tempDir, "ai_cover_jeremy_only.ogg");
            await replyMessage.edit(`Covering ${tracksSelection} with AI jeremygamer13 (this may take a bit)`
                + "\n" + `Speech: ${aiSpeechMethod}; semitones: ${aiSemitones}`);
            await RVC.infer(selectedTrack, env.get("COVER_PATH_MODEL"), env.get("COVER_PATH_INDEX"), outputPathAICover, aiSpeechMethod, aiSemitones);

            // if simultaneous, just adjust volume. If not simultaneous, merge audio
            let finalAudio = null;
            if (tracksSelection === "simultaneous") {
                const outputRemuxedPath = path.join(tempDir, `ai_cover_jeremy_remuxed.ogg`);
                await replyMessage.edit(`adjusting volume`
                    + `\n` + `settings: volume: ${volumeAdjustment}x`);
                await FFmpegUtil.commands.adjustVolume(outputPathAICover, outputRemuxedPath, volumeAdjustment);
                finalAudio = outputRemuxedPath;
            } else {
                const outputMixedPath = path.join(tempDir, `ai_cover_jeremy_merged.ogg`);
                await replyMessage.edit(`Mixing with AI ${tracksSelection}`
                    + " " + `(${tracksSelection === "instrumental" ? "liar macaron reference" : "basically the opposite of liar macaron"})`
                    + `\n` + `settings: volume: ${volumeAdjustment}x`);
                await FFmpegUtil.commands.mixAudio(backingTrack, outputPathAICover, outputMixedPath, volumeAdjustment);
                finalAudio = outputMixedPath;
            }

            await replyMessage.edit({
                content: "Completed in " + ((Date.now() - startTime) / 1000) + " seconds"
                    + "\n" + `-# Generated by <@${message.author.id}>`,
                files: [finalAudio]
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