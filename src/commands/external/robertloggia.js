const fs = require("fs/promises");
const path = require("path");
const nodeUtil = require("util");
const childProcess = require("child_process");

const execPromise = nodeUtil.promisify(childProcess.exec);

const discord = require("discord.js");

const TTS = require("../../util/tts.js");
const TempFolder = require('../../util/temp-folder.js');
const FFmpegUtil = require("../../util/ffmpeg-util.js");

const RobertLoggiaSentences = require("../../resources/robert-loggia.json");

class Command {
    constructor() {
        this.name = "robertloggia";
        this.description = `Certainly. That's Robert Loggia. R, as in 'Robert Loggia.'`;
        this.descriptionLong = `Recreates a video of the Robert Loggia cutaway gag from Family Guy, using a user's name.`
            + "\n" + "- To make a video for yourself, don't specify anything."
            + "\n" + "- To make a video of another user, ping them in the message."
            + "\n" + "- To make a video with a custom name, specify a message string to be used."
            + "\n" + "Attach an image to use a different image for the user.";
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
        };

        this.example = [
            { text: "{{prefix}}robertloggia" },
            { text: "{{prefix}}robertloggia @user" },
            { text: "{{prefix}}robertloggia John Oracle" },
        ];
        this.alias = ["robert", "loggia", "loggiarobert", "lolnobodyisusingthisaliaspoopoopasiudhaual1rf-p[qif2;"];
    }

    /**
     * @param {import("discord.js").Message} message 
     * @param {string[]} args 
     * @param {import("../../util/utility.js")} util 
     * @returns 
     */
    async handle(message, args, util) {
        const customText = args.join(" ");
        if (customText && !util.request("isInPersonalMode") && util.getPermissionLevel(message) < 4 && !util.automodAllows(customText, true))
            return message.reply("Enter something else.");

        const mentionedUser = message.mentions && message.mentions.members && message.mentions.members.size ? message.mentions.members.first() : null;
        const targetUser = mentionedUser ? mentionedUser : (customText ? null : (message?.member || message?.author));
        
        /** @type {string} */
        const targetName = targetUser ? (targetUser.displayName || targetUser.username) : customText;

        const [imageBuffer] = await util.getInputImagesForCommand(message);
        if (!imageBuffer) return;
        
        // get the response
        // actually start doing stuff
        console.log("robertloggia cmd");
        const jobName = TempFolder.makeTempName("robertloggia");
        const temporaryFolder = new TempFolder(jobName);
        await temporaryFolder.createAndDestroy(async (tempDir) => {
            // download the pfp or image
            const imagePath = path.join(tempDir, "image.png");
            await fs.writeFile(imagePath, imageBuffer);

            // make the scrip[t]
            let outputText = "";
            const sentenceVariants = new Set();
            for (const letter of targetName) {
                const letterLower = letter.toLowerCase();
                const targetNameLower = targetName.toLowerCase();

                // if this letter is the same as the target name
                if (targetNameLower.startsWith(letterLower)) {
                    outputText += `${letter.toUpperCase()}, as in ${targetName}.` + "\n";
                    continue;
                }

                // see if we have a list of sentences for this letter
                /** @type {string[]} */
                const sentences = RobertLoggiaSentences[letterLower];
                // if this letter isnt found in our script
                if (!sentences) {
                    outputText += `${letter}.` + "\n";
                    continue;
                }
                // if there's only one variant of this letter, it's likely a separator
                if (sentences.length <= 1) {
                    outputText += `${sentences[0]}` + "\n";
                    continue;
                }

                // use each sentence in order. irst check if we already exhausted our sentence list
                if (sentences.every(sentence => sentenceVariants.has(sentence))) {
                    for (const sentence of sentences)
                        sentenceVariants.delete(sentence);
                }
                // get a sentence that we make suree we havent used this before
                for (const sentence of sentences) {
                    if (!sentenceVariants.has(sentence)) {
                        outputText += `${sentence.replace("{{NAME}}", targetName)}` + "\n";
                        sentenceVariants.add(sentence);
                        break;
                    }
                }
            }

            console.log(outputText);

            // make TTS read these
            const spelledOutReading = `Certainly. Thats ${targetName}.`
                + "\n" + outputText.trim().replace(/[\"“”]/g, "");
            const reply = await message.reply("Reading aloud the script with TTS");

            const bufferNameReadaloud = await TTS.speak(targetName, "google");
            const bufferSpelledOutReadaloud = await TTS.speak(spelledOutReading, "google");
            const pathNameReadaloud = path.join(tempDir, "name.mp3");
            const pathSpelledOutReadaloud = path.join(tempDir, "spelled.mp3");
            await fs.writeFile(pathNameReadaloud, bufferNameReadaloud);
            await fs.writeFile(pathSpelledOutReadaloud, bufferSpelledOutReadaloud);

            // stitch together the video
            await reply.edit("Stitching together a video...");

            // create our readaloud videos
            // NOTE: name2 is Robert Loggia saying the targetName again, so it uses the same pathNameReadaloud clip
            // NOTE: We dont use FFmpegUtil because this is too specific to implement into that utility
            const videoLoggia1 = path.resolve("./assets/robertloggia/loggia1.mp4");
            const videoLoggiaName = path.resolve("./assets/robertloggia/loggia2.mp4");
            const videoLoggia3 = path.resolve("./assets/robertloggia/loggia3.mp4");
            const videoLoggia4 = path.resolve("./assets/robertloggia/loggia4.mp4");
            const videoLoggiaName2 = path.resolve("./assets/robertloggia/loggia5.mp4");
            const videoLoggia6 = path.resolve("./assets/robertloggia/loggia6.mp4");
            const videoLoggiaSpelledOut = path.resolve("./assets/robertloggia/loggia7.mp4");
            const videoLoggia8 = path.resolve("./assets/robertloggia/loggia8.mp4");
            const videoOutputName = path.join(tempDir, "loggiaName.mp4");
            const videoOutputName2 = path.join(tempDir, "loggiaName2.mp4");
            const videoOutputSpelledOut = path.join(tempDir, "loggiaSpelledOut.mp4");
            const commandName = `ffmpeg -y -stream_loop -1 -i "${videoLoggiaName}" -i "${pathNameReadaloud}" -vf "scale=480:360" -c:v libx264 -b:v 128k -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${videoOutputName}"`;
            const commandName2 = `ffmpeg -y -stream_loop -1 -i "${videoLoggiaName2}" -i "${pathNameReadaloud}" -vf "scale=480:360" -c:v libx264 -b:v 128k -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${videoOutputName2}"`;
            const commandNameSpelledOut = `ffmpeg -y -stream_loop -1 -i "${videoLoggiaSpelledOut}" -i "${pathSpelledOutReadaloud}" -vf "scale=480:360" -c:v libx264 -b:v 128k -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${videoOutputSpelledOut}"`;
            await execPromise(commandName);
            await execPromise(commandName2);
            await execPromise(commandNameSpelledOut);

            // stitch everything together
            const videoOutputStitch = path.join(tempDir, "stitchedloggia.mp4");
            const commandStitch = `ffmpeg -y`
                + " " + `-i "${videoLoggia1}"`
                + " " + `-i "${videoOutputName}"`
                + " " + `-i "${videoLoggia3}"`
                + " " + `-i "${videoLoggia4}"`
                + " " + `-i "${videoOutputName2}"`
                + " " + `-i "${videoLoggia6}"`
                + " " + `-i "${videoOutputSpelledOut}"`
                + " " + `-i "${videoLoggia8}"`
                + " " + `-filter_complex "[0:v]scale=480:360,setsar=1[v0];`
                    + `[1:v]scale=480:360,setsar=1[v1];`
                    + `[2:v]scale=480:360,setsar=1[v2];`
                    + `[3:v]scale=480:360,setsar=1[v3];`
                    + `[4:v]scale=480:360,setsar=1[v4];`
                    + `[5:v]scale=480:360,setsar=1[v5];`
                    + `[6:v]scale=480:360,setsar=1[v6];`
                    + `[7:v]scale=480:360,setsar=1[v7];`
                    + `[v0][0:a][v1][1:a][v2][2:a][v3][3:a][v4][4:a][v5][5:a][v6][6:a][v7][7:a]concat=n=8:v=1:a=1[outv][outa]"`
                + " " + `-map "[outv]" -map "[outa]" -c:v libx264 -c:a aac "${videoOutputStitch}"`
            await execPromise(commandStitch);

            // staple the character ontop now that all the robert loggia clips are in order
            // NOTE: This is also where we apply the final compression
            const lengthLoggia1 = await FFmpegUtil.probe.length(videoLoggia1);
            const lengthOutputName = await FFmpegUtil.probe.length(videoOutputName);
            const lengthLoggia3 = await FFmpegUtil.probe.length(videoLoggia3);
            const videoOutputCharacter = path.join(tempDir, "robert-loggia.mp4");
            const commandCharacter = `ffmpeg -y -i "${videoOutputStitch}" -i "${imagePath}"`
                + " " + `-filter_complex "[1:v]scale=155:231[img];[0:v][img]overlay=x=(W-w)/2:y=(H-h)/2:enable='gte(t,${lengthLoggia1 + lengthOutputName + lengthLoggia3})'[outv]"`
                + " " + `-map "[outv]" -map 0:a -c:v libx264 -b:v 48k -c:a copy "${videoOutputCharacter}"`;
            await execPromise(commandCharacter);

            reply.edit({
                content: `Generated by <@${message.author.id}>`,
                files: [videoOutputCharacter],
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        });
    }
    async invoke(message, args, util) {
        await this.handle(message, args, util);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;