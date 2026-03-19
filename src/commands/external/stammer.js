const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const env = require("../../util/env-util");
const probeLength = require('../../util/probe-length');

class Command {
    constructor() {
        this.name = "stammer";
        this.description = "Make a video using another video";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };

        this.processing = false;
    }

    async handle(message, args, util, replyMessage) {
        // track time
        const startTime = Date.now();

        // check attachements
        const attachment1 = message.attachments.first();
        const attachment2 = message.attachments.last();
        if (!attachment1) return replyMessage.edit("Add an mp4 video to take the frames from");
        if (!attachment2) return replyMessage.edit("Add an mp4 video to sync the video to");
        const endingType1 = util.getAttachmentType(attachment1);
        const endingType2 = util.getAttachmentType(attachment2);
        if (endingType1 !== "mp4") return replyMessage.edit('Please use a valid video in `.mp4` format.');
        if (endingType2 !== "mp4") return replyMessage.edit('Please use a valid video in `.mp4` format.');
        // check atachemtn size
        if (attachment1.size > 15 * 1e+6) return replyMessage.edit("Files must be below 15 MB.");
        if (attachment2.size > 15 * 1e+6) return replyMessage.edit("Files must be below 15 MB.");

        // prep to download
        replyMessage.edit("Downloading video...");
        const tempDir = path.join(__dirname, `../../../temp/stammer`);
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        // download
        const fetch1 = await fetch(attachment1.url);
        const fetch2 = await fetch(attachment2.url);
        const arrayBuffer1 = await fetch1.arrayBuffer();
        const arrayBuffer2 = await fetch2.arrayBuffer();
        const file1 = Buffer.from(arrayBuffer1);
        const file2 = Buffer.from(arrayBuffer2);
        const path1 = path.join(tempDir, `input1.${endingType1}`);
        const path2 = path.join(tempDir, `input2.${endingType2}`);
        fs.writeFileSync(path1, file1);
        fs.writeFileSync(path2, file2);
        // check length
        const length1 = await probeLength(path1);
        const length2 = await probeLength(path2);
        if (length1 > 5 * 60) return replyMessage.edit("Files must be within 5 minutes long OR you can buy me 64 gigabytes of ram 🎉");
        if (length2 > 5 * 60) return replyMessage.edit("Files must be within 5 minutes long OR you can buy me 64 gigabytes of ram 🎉");

        // generate
        replyMessage.edit("Generating stammer video...");
        const outputPath = path.join(tempDir, `output.mp4`);
        const command = `${env.get("STAMMER_PYTHON")}`
            .replaceAll("{{CARRIER}}", `"${path1}"`)
            .replaceAll("{{MODULATOR}}", `"${path2}"`)
            .replaceAll("{{OUTPUT}}", `"${outputPath}"`);
        childProcess.execSync(command, {
            cwd: env.get("STAMMER_PATH")
        });

        replyMessage.edit({
            content: "Completed in " + ((Date.now() - startTime) / 1000) + " seconds",
            files: [outputPath]
        });
    }
    async invoke(message, args, util) {
        const canDo = util.request("heavyExternalStuff");
        if (!canDo) return message.reply("disabled (im probably playing a game)");
        if (this.processing) return message.reply("Yo chill tf out yo");

        this.processing = true;
        let replyMessage;
        try {
            replyMessage = await message.reply("Generating output...");
            await this.handle(message, args, util, replyMessage);
        } catch (err) {
            this.processing = false;
            replyMessage.edit(`${err}`.substring(0, 2000));
            throw err;
        } finally {
            this.processing = false;
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;