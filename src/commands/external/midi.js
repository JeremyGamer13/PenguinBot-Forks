const fs = require("fs/promises");
const path = require("path");
const childProcess = require("child_process");

const { default: slash } = require("slash");

const env = require("../../util/env-util.js");
const Polyphone = require("../../util/polyphone.js");
const FluidSynth = require("../../util/fluidsynth.js");
const TempFolder = require('../../util/temp-folder.js');
const FFmpegUtil = require("../../util/ffmpeg-util.js");
const downloadAttachments = require('../../util/download-attachments.js');

class Command {
    constructor() {
        this.name = "midi";
        this.description = "Play a MIDI file";
        this.descriptionLong = "Play a MIDI (.mid/.midi) file."
            + "\n" + "-" + " " + "Attach a MIDI file to render it with the default SoundFont."
            + "\n" + "-" + " " + "Attach a MIDI file, and an additional sample file (.mp3, .ogg, etc) to use the sample as the only instrument.";
        this.attributes = {
            unlisted: false,
            lockedToCommands: true,
            permission: 0,
        };
    }

    async handle(message, args, util) {
        // get attachements
        const attachment = message.attachments.first();
        const attachmentSample = message.attachments.size > 1 ? message.attachments.last() : null;
        if (!attachment) throw new Error("Add an  midi");
        const endingType = util.getAttachmentType(attachment);
        const endingTypeSample = util.getAttachmentType(attachmentSample);
        if (!["midi", "x-midi", "sp-midi"].includes(endingType)) throw new Error('The first file should be a valid MIDI file.');
        if (attachmentSample && !FFmpegUtil.isCompatibleAudio(endingTypeSample)) throw new Error('Please use a valid audio format when using a sample.');
        // // check atachemtn size
        if (attachment.size > 1 * 1e+6) throw new Error("MIDI files must be below 1 MB.");
        if (attachmentSample && attachmentSample.size > 5 * 1e+6) throw new Error("Sample files must be below 5 MB.");

        // actually start doing stuff
        const startTime = Date.now();
        const jobName = TempFolder.makeTempName("midi");
        const temporaryFolder = new TempFolder(jobName);
        await temporaryFolder.createAndDestroy(async (tempDir) => {
            // type because this hsould be quick
            try { await message.channel.sendTyping(); } catch { }

            // download
            const [
                midiFilePath,
                rawSamplePath
            ] = await downloadAttachments([
                attachment,
                ...(attachmentSample ? [attachmentSample] : [])
            ], (i, att) => `input${i}.${att === attachment ? "mid" : "bin"}`, tempDir);
            const sampleName = `sampleToUse.ogg`;
            const samplePath = path.join(tempDir, sampleName);
            if (attachmentSample) {
                // convert to safe type
                const safePath = path.join(tempDir, `sample_safe.ogg`);
                await FFmpegUtil.commands.convertToSafeOgg(rawSamplePath, safePath);
                // check length
                const length = await FFmpegUtil.probe.length(safePath);
                if (length > 5 * 60) return message.reply("Sample must be within 5 minutes long");
                // normalize for consistency
                await FFmpegUtil.commands.normalize(safePath, samplePath);
            }

            // if we have a sample then we need to make a soundfont to render with
            let soundFontPath = env.get("FLUIDSYNTH_SOUNDFONT");
            let synthConfigPath = null;
            if (attachmentSample) {
                const sfzPath = path.join(tempDir, "soundfont_sample.sfz");
                const sf3Path = path.join(tempDir, "soundfont_sample.sf3");
                const cfgPath = path.join(tempDir, "routing.cfg");
                // DISCLOSURE: These 2 scripts are AI because stuff js wasnt working
                const sfzScript = `<group>`
                    + "\n" + `loop_mode=no_loop`
                    + "\n"
                    + "\n" + `<region>`
                    + "\n" + `sample=${sampleName}`
                    + "\n" + `lokey=c-1`
                    + "\n" + `hikey=g9`
                    + "\n" + `pitch_keycenter=c5`;
                const configScript = Array.from({ length: 128 }, (_, bank) =>
                    `load "${slash(sf3Path)}" ${bank === 127 ? 1 : 0} ${bank}`
                ).join("\n");
                console.log(sfzScript, configScript);
                await fs.writeFile(sfzPath, sfzScript, "utf8");
                await fs.writeFile(cfgPath, configScript, "utf8");
                await Polyphone.convert(sfzPath, sf3Path, "sf3");
                soundFontPath = sf3Path;
                synthConfigPath = cfgPath;
            }

            // render  midi
            const outputPathWav = path.join(tempDir, `midi_rendered.wav`);
            await FluidSynth.renderMidi(midiFilePath, outputPathWav, soundFontPath, synthConfigPath);

            // convret to ogg
            const outputPathOgg = path.join(tempDir, "midi_rendered.ogg");
            await FFmpegUtil.commands.convertToSafeOgg(outputPathWav, outputPathOgg);

            // normalize
            const outputPathNormalized = path.join(tempDir, "midi_normalized.ogg");
            await FFmpegUtil.commands.normalize(outputPathOgg, outputPathNormalized);

            return await message.reply({
                content: "Rendered in " + ((Date.now() - startTime) / 1000) + " seconds"
                    + "\n" + `-# Generated by <@${message.author.id}>`,
                files: [outputPathNormalized]
            });
        });
    }
    async invoke(message, args, util) {
        await this.handle(message, args, util);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;