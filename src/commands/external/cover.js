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

        this.cooldownUsers = {};
    }

    reject(message) {
        return message.reply("no");
    }

    requestApproval(replyMessage, message, args, inputPath) {
        return new Promise(async (resolve) => {
            const requestChannel = await this.client.channels.cache.get("1488362939130974258");
            if (!requestChannel) throw new Error("Couldnt find the logging channel? What the fuck");

            const messageLink = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;
            const rows = [
                new discord.MessageActionRow().addComponents([
                    new discord.MessageButton({
                        customId: 'accept',
                        style: 'PRIMARY',
                        label: "Allow",
                    }),
                    new discord.MessageButton({
                        customId: 'deny',
                        style: 'DANGER',
                        label: "Deny",
                    }),
                ]),
            ];

            const requestDetails = `AI cover request Coming from <@${message.author.id}> at ${messageLink}`
                + `\n` + `Settings: \`\`${JSON.stringify(args)}\`\``
            const requestMessage = await requestChannel.send({
                content: `# Request`
                    + `\n` + requestDetails
                    + `\n` + `<@462098932571308033>`,
                components: rows,
                files: [inputPath]
            });

            let completedInteraction = false;
            const col = requestMessage.createMessageComponentCollector({
                filter: i => i.user.id === "462098932571308033",
                time: 10 * 60 * 1000
            });
            col.on('collect', async (i) => {
                if (i.customId === "accept") {
                    completedInteraction = true;
                    resolve(true);

                    requestMessage.edit({
                        content: `# Request APPROVED`
                            + `\n` + requestDetails
                    });
                } else {
                    // let them know
                    await replyMessage.edit("Your request was denied."
                        + "\n" + "-# haha L");
                    
                    completedInteraction = true;
                    resolve(false);

                    requestMessage.edit({
                        content: `# Request DENIED`
                            + `\n` + requestDetails
                    });
                }
            })
            col.on('end', async () => {
                if (completedInteraction) return;

                // let them know
                await replyMessage.edit("Your request was Taking Too Long. So i killed it"
                    + "\n" + "-# haha L");
                resolve(false);

                requestMessage.edit({
                    content: `# Request took too damn long`
                        + `\n` + requestDetails
                });
            });
        });
    }
    async handle(message, args, util) {
        if (util.getPermissionLevel(message) < 4) {
            // if (this.cooldownUsers[message.author.id] > Date.now()) return message.reply("no too much");
        }

        const speechMethodsAllowed = [
            // speech
            "normal", "robotic",
            // semitones
            "high", "raise", "mid", "drop", "low",
            // volume
            "louder", "quieter",
        ];
        if (!args[0]) return message.reply(`listing methods, add \`normal\` to your message to silence:`
            + "\n" + `\`\`${speechMethodsAllowed.map(m => JSON.stringify(m)).join(", ")}\`\``
            + "\n" + `these can be added in sequence (however some overwrite others), the default is "normal" + "mid" (you might wanna use "low" for accuracy)`
            + "\n" + `note that ANY AUDIO you upload WILL BE SAVED for the bot to MANUALLY approve / deny so dont upload bad stuff`);
        if (args.length > 256) return message.reply("yo thats too many settings bro calm down you do not need allat");

        let aiSpeechMethod = "rmvpe";
        let aiSemitones = 0;
        let volumeAdjustment = 1;
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
        this.cooldownUsers[message.author.id] = Date.now() + 5 * 60 * 60;

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
            await FFmpegUtil.convertToSafeOgg(rawInputPath, inputPath);
            // check length
            const length = await FFmpegUtil.probeLength(inputPath);
            if (length > 5 * 60) return replyMessage.edit("Files must be within 5 minutes long OR you can buy me an NVIDIA RTX 4090 🎉");

            // see if we need approval
            if (message.guildId !== "746156168560508950") {
                await replyMessage.edit("# me and ishowspeed need to approve your audio"
                    + "\n" + "Please wait for your audio to be accepted."
                    + "\n" + "- You may be denied if im already processing a song (im too lazy to add a real queue thing)"
                    + "\n" + "- You may be denied if im not currently active or the bot is about to shut down for the day"
                    + "\n" + "- You may be denied if the audio has no vocals"
                    + "\n" + "- Genuinely offensive/inappropriate content will be denied AND result in a **permanent ban** from the server!");
                const accepted = await this.requestApproval(replyMessage, message, args, inputPath);
                if (!accepted) return; // rejects will be handled by requestApproval
            }

            // generate
            await replyMessage.edit("Continuing process, Splitting audio with demucs...");
            const [outputPathInst, outputPathVocals] = await Demucs.splitVocals(inputPath, tempDir);

            // convert to OGG for later when we merge them
            await replyMessage.edit("Converting to OGG... (because wav files are Fat)");
            const outputPathOggInst = path.join(tempDir, "instrumental.ogg");
            const outputPathOggVocals = path.join(tempDir, "vocals.ogg");
            await FFmpegUtil.convertToSafeOgg(outputPathInst, outputPathOggInst);
            await FFmpegUtil.convertToSafeOgg(outputPathVocals, outputPathOggVocals);

            // have my AI voice cover it
            const outputPathAICover = path.join(tempDir, "ai_cover_jeremy_voice_only.ogg");
            await replyMessage.edit("Covering with AI jeremygamer13 (this may take a bit)"
                + "\n" + `Speech: ${aiSpeechMethod}; semitones: ${aiSemitones}`);
            await RVC.infer(outputPathOggVocals, env.get("COVER_PATH_MODEL"), env.get("COVER_PATH_INDEX"), outputPathAICover, aiSpeechMethod, aiSemitones);

            // merge audio
            const outputMixedPath = path.join(tempDir, `ai_cover_jeremy_merged.ogg`);
            await replyMessage.edit(`Mixing instrumental with AI vocals (basically the opposite of liar macaron)`
                + `\n` + `settings: volume: ${volumeAdjustment}x`);
            await FFmpegUtil.mixAudio(outputPathOggInst, outputPathAICover, outputMixedPath, volumeAdjustment);

            await replyMessage.edit({
                content: "Completed in " + ((Date.now() - startTime) / 1000) + " seconds"
                    + "\n" + `-# Generated by <@${message.author.id}>`,
                files: [outputMixedPath]
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