const fs = require("fs/promises");
const path = require("path");
const nodeUtil = require("util");
const childProcess = require("child_process");

const execPromise = nodeUtil.promisify(childProcess.exec);

const discord = require("discord.js");

const Ollama = require("ollama-chatting");
const OllamaModels = require("../../util/ollama-models.js");
const OllamaChat = new Ollama({ host: OllamaModels.url });

const TTS = require("../../util/tts.js");
const TempFolder = require('../../util/temp-folder.js');
const FFmpegUtil = require("../../util/ffmpeg-util.js");

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
            unlisted: true,
            permission: 4,
            lockedToCommands: true,
            jgollamaConfigsInvolved: ["lightText"],
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

            // now start
            const reply = await message.reply(`Generating the ✨🎇✨🌟✨🌟script✨✨🌟✨🎇`);

            let outputText = null;
            try {
                const output = await OllamaChat.generate({
                    ...OllamaModels.genericIO,
                    prompt: `Write a script where you use sentences to spell out each letter of the target name: \"${targetName}\"`,
                    system: `You are a specialized text-generation engine and scriptwriter. When a user provides a target name, your sole function is to spell out that exact name character by character in a single, continuous, uninterrupted script.`
                        + "\n" + `You must output **zero** conversational filler, zero introductory text, and zero concluding remarks—begin immediately with the first character and end immediately after the final character.`
                        + "\n"
                        + "\n" + `### Structural and Formatting Rules:`
                        + "\n"
                        + "\n" + `1. **Sequential Character Breakdown:**`
                        + "\n" + `* Iterate through every single alphabetical character of the target name in exact left-to-right order, handling letters and spaces individually.`
                        + "\n"
                        + "\n" + `2. **Rigid Acronym Syntax:**`
                        + "\n" + "* For every alphabetical character in the target name, format your output precisely as: `[Letter], as in '[Sentence].'` (or use `!` or `?` inside the quotation marks if the sentence requires it)."
                        + "\n" + "* When the target name has a space (` `) character, read it out as `Space.` exactly, and include it as its own sentence to clearly delineate word boundaries."
                        + "\n"
                        + "\n" + `3. **Sentence Constraints & Name Integration:**`
                        + "\n" + `* **Phonetic Starter:** Each sentence must begin with the exact alphabetical letter currently being spelled in plaintext without any formatting.`
                        + "\n" + `* **Mandatory Name Placement at the End:** Every single generated sentence must conclude with the **full, complete target name** as its final words.`
                        + "\n" + `* **Deep Name Integration (No Tag-Ons):** The target name must end the sentence, but it **must be grammatically woven directly into the core clause** (e.g., as a direct object, predicate noun, or completion of a verb/preposition). Do **not** use the name as a comma-separated address or afterthought.`
                        + "\n" + `* **Contextual Variety:** Vary the tone and structure of your sentences (e.g., make an exclamation, a remark, a humorous quip), but ensure every single one references the target name directly.`
                        + "\n" + `* **Tone & Vocabulary Guidance**: Avoid archaic, medieval, or high-fantasy styling. Instead, use contemporary, everyday, or casual modern phrasing.`
                        + "\n" + `* **Strict Length:** Keep every sentence **short, punchy, and concise** (maximum 8 to 12 words). Avoid long, rambling clauses.`
                        + "\n"
                        + "\n" + `4. **Execution Directive:**`
                        + "\n" + `* Do not default to generic dictionary definitions or standard phonetic alphabet words. Every entry must be a custom sentence built entirely around the target name.`
                }, (chunk) => {
                    if (chunk.chunk.thinking) process.stdout.write(chunk.chunk.thinking);
                    if (chunk.chunk.response) process.stdout.write(chunk.chunk.response);
                });

                outputText = output.response;
            } catch (err) {
                return reply.edit("**Took too long to prompt.** If this happens frequently then Ollama is probably not open on my PC right now");
            }

            // make TTS read these
            const spelledOutReading = `Certainly. Thats ${targetName}.`
                + "\n" + outputText.trim().replace(/[\"“”]/g, "");
            await reply.edit("Reading aloud the script with TTS");

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
            const commandName = `ffmpeg -y -stream_loop -1 -i "${videoLoggiaName}" -i "${pathNameReadaloud}" -vf "scale=480:360" -c:v libx264 -b:v 300k -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${videoOutputName}"`;
            const commandName2 = `ffmpeg -y -stream_loop -1 -i "${videoLoggiaName2}" -i "${pathNameReadaloud}" -vf "scale=480:360" -c:v libx264 -b:v 300k -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${videoOutputName2}"`;
            const commandNameSpelledOut = `ffmpeg -y -stream_loop -1 -i "${videoLoggiaSpelledOut}" -i "${pathSpelledOutReadaloud}" -vf "scale=480:360" -c:v libx264 -b:v 300k -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${videoOutputSpelledOut}"`;
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
                + " " + `-map "[outv]" -map 0:a -c:v libx264 -b:v 64k -c:a copy "${videoOutputCharacter}"`;
            await execPromise(commandCharacter);

            reply.edit({
                content: `Generated by <@${message.author.id}>. Generate again if the AI was stupid and didnt use the name at all`,
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
        const canDo = util.request("heavyExternalStuff");
        if (!canDo) return message.reply("disabled (im probably playing a game)");

        await this.handle(message, args, util);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;