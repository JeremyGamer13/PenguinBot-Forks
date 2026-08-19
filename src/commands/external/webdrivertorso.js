const fs = require("fs/promises");
const path = require("path");

const discord = require("discord.js");

const { Canvas, FontLibrary } = require("skia-canvas");

const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const TempFolder = require('../../util/temp-folder.js');
const FFmpegUtil = require("../../util/ffmpeg-util.js");

class Command {
    constructor() {
        this.name = "webdrivertorso";
        this.description = `Creates a Webdriver Torso-like video [(see inspiration)](https://www.youtube.com/@realwebdrivertorso/videos)`;
        this.attributes = {
            permission: 0,
            lockedToCommands: true,
        };

        this.alias = ["webdriver"];

        // load the font
        FontLibrary.use("WebdriverTorso", ["./assets/fonts/Courier10PitchBT-Bold.otf"]);
    }

    /**
     * @param {import("discord.js").Message} message 
     * @param {string[]} args 
     * @param {import("../../util/utility.js")} util 
     * @returns 
     */
    async handle(message, args, util) {
        // actually start doing stuff
        console.log("webdrivertorso cmd");
        const jobName = TempFolder.makeTempName("webdrivertorso");
        const temporaryFolder = new TempFolder(jobName);
        await temporaryFolder.createAndDestroy(async (tempDir) => {
            // this is heavily based o n https://github.com/joepurdy/webdriver-torso/blob/main/webdriver-torso.sh
            // make the images with canvas
            const pathsSlides = [];
            const canvas = new Canvas(640, 360);
            const ctx = canvas.getContext("2d");
            for (let i = 0; i < 10; i++) {
                // clear bg
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                // draw blue
                ctx.fillStyle = "#000FFF";
                ctx.fillRect(Math.floor(Math.random() * 640), Math.floor(Math.random() * 330), Math.floor(Math.random() * 640), Math.floor(Math.random() * 330));
                // draw red
                ctx.fillStyle = "#FF1800";
                ctx.fillRect(Math.floor(Math.random() * 640), Math.floor(Math.random() * 330), Math.floor(Math.random() * 640), Math.floor(Math.random() * 330));
                // draw slide count
                ctx.font = "12px WebdriverTorso";
                ctx.textBaseline = "top";
                ctx.fillStyle = "#020202";
                for (let _ = 0; _ < 2; _++)
                    ctx.fillText(`aqua.flv - Slide ${`${i}`.padStart(4, "0")}`, 10, 340);

                // render
                const outputPath = path.join(tempDir, `frame${String(i).padStart(6, '0')}.png`);
                const buffer = await canvas.toBuffer("png");
                await fs.writeFile(outputPath, buffer);
                pathsSlides.push(outputPath);
            }

            // make the sine wave sounds
            const pathsSine = [];
            for (let i = 0; i < 10; i++) {
                const sineFrequency = Math.floor(Math.random() * 3300) + 300;
                const outputPath = path.join(tempDir, `sine${String(i).padStart(6, '0')}.wav`);

                // https://superuser.com/questions/724391/how-to-generate-a-sine-wave-with-ffmpeg
                // ffmpeg -f lavfi -i "sine=frequency=3599:duration=1" test.wav
                const audio = ffmpeg()
                    .input(`sine=frequency=${sineFrequency}:duration=1`)
                    .inputFormat("lavfi")
                    .output(outputPath);
                await new Promise((resolve, reject) => {
                    audio.on("end", () => resolve());
                    audio.on("error", (err) => reject(err));
                    audio.run();
                });
                pathsSine.push(outputPath);
            }

            // make the video
            const outputVideoPath = path.join(tempDir, `webdriver-torso.mp4`);
            const video = ffmpeg();
            for (const pathSlide of pathsSlides)
                video.input(pathSlide).duration(1);
            for (const pathSine of pathsSine)
                video.input(pathSine);

            // DISCLOSURE: thies is ai because flitercomplex is killing death machine
            let filters = [];
            let concatInputs = "";
            for (let i = 0; i < 10; i++) {
                filters.push(`[${i}:v]scale=640:360,format=yuv420p[v${i}]`);
                concatInputs += `[v${i}][${10 + i}:a]`;
            }
            filters.push(`${concatInputs}concat=n=10:v=1:a=1[finalv][finala]`);
            video.complexFilter(filters.join(";"));
            video.outputOptions([
                "-map [finalv]",
                "-map [finala]",
                "-c:v libx264",
                "-c:a aac",
                "-pix_fmt yuv420p",
                "-t 10"
            ]);
            video.format("mp4");
            video.output(outputVideoPath);

            // generate tha vidoe
            await new Promise((resolve, reject) => {
                video.on("end", () => resolve());
                video.on("error", (err) => reject(err));
                video.run();
            });

            await message.reply({
                content: `Generated by <@${message.author.id}> (May be loud idk)`,
                files: [outputVideoPath],
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