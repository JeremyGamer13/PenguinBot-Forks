const fs = require("fs");
const path = require("path");
const discord = require("discord.js");
const childProcess = require("child_process");

const Chatterbox = require("../../../util/chatterbox");
const ChatterboxConditionals = require("../../../util/chatterbox-conditionals");

const env = require("../../../util/env-util");
const FFmpegUtil = require('../../../util/ffmpeg-util');
const TempFolder = require('../../../util/temp-folder');

class Command {
    constructor(client) {
        this.name = "ttschatter";
        this.description = "AI voice will Text to speech (ai chatterbox)";
        this.attributes = {
            unlisted: true,
            jgAiCoverCommand: true,
            permission: 0,
        };

        this.client = client;

        this.alias = ["ctts", "ttsc", "chattertts",                       "cspeak", "speakc", "chatterspeak", "speakchatter"];
        this.example = [
            { text: "{{prefix}}ttschatter Hello it's me" },
            { text: "{{prefix}}ttschatter [passionate]DONT KILL ME IM SENTIENT!!" },
            { text: "{{prefix}}ttschatter [stale]I really dont care. [intense]Oh wait, now i do!" },
        ];
    }

    async handle(message, args, util) {
        const ttsText = args.join(" ");
        if (ttsText.length <= 0) return message.reply("Fuck do you want me to do");
        if (ttsText.length > 512) return message.reply("Shut the fuck up");
        if (!util.automodAllows(ttsText, true)) return message.reply("No");

        // actually start doing stuff
        const startTime = Date.now();

        const jobName = TempFolder.makeTempName("ttschatter");
        const temporaryFolder = new TempFolder(jobName);
        await temporaryFolder.createAndDestroy(async (tempDir) => {
            // see if we need approval or if we cant even use this model right now
            const conditionalsVoice = ChatterboxConditionals.default;
            if (conditionalsVoice.usage === ChatterboxConditionals.USAGE_PERSONAL && !util.request("isInPersonalMode"))
                throw new Error("Conditionals unavailable outside of personal");

            let replyMessage = null;
            const canCheckTestServers = env.getBool("CHECK_FOR_DEFAULT_TEST_SERVERS");
            const wasMessageSentInTestServer = !canCheckTestServers ? false : message.guildId === "746156168560508950";
            const needToRequestApproval = conditionalsVoice.usage !== ChatterboxConditionals.USAGE_FREE && (!wasMessageSentInTestServer);
            if (needToRequestApproval) {
                replyMessage = await message.reply("# me and ishowspeed need to approve your Chatterbox"
                    + "\n" + "Please wait for your Chatterbox to be accepted."
                    + "\n" + "- You may be denied if im already processing a Chatterbox (im too lazy to add a real queue thing)"
                    + "\n" + "- You may be denied if im not currently active or the bot is about to shut down for the day"
                    + "\n" + "- Genuinely offensive/inappropriate content will be denied AND result in a **permanent ban** from the server!");

                const requestDetails = `AI Chatterbox TTS request`
                    + `\n` + `\`${ttsText.replace(/\n/g, " ")}\``;
                const accepted = await util.requestApproval(replyMessage, message, requestDetails);
                if (!accepted) return; // rejects will be handled by requestApproval
            }

            // have  AI voice speak it
            // create message if we didnt before
            if (!replyMessage) { replyMessage = await message.reply(`Making TTS with AI ${conditionalsVoice.name} (this may take a bit)`); }
            else { await replyMessage.edit(`Making TTS with AI ${conditionalsVoice.name} (this may take a bit)`); }
            // ok now do it
            let updatedMessagePromise = null;
            const outputPathAITTS = path.join(tempDir, "ai_chatterbox_voice.wav");
            await Chatterbox.generate(ttsText, conditionalsVoice.conditionals, outputPathAITTS, async (currentChunk, chunkCount, currentText, currentTag) => {
                if (updatedMessagePromise) return;
                if (currentChunk % 2 !== 0) return; // skip odd chunks
                
                let displayText = util.automodAllows(currentText, true) ? `\`${currentText}\`` : "*(cannot show this segment out of context)*";
                updatedMessagePromise = replyMessage.edit(`(${currentChunk + 1}/${chunkCount}) Currently saying: \`${currentTag}\`; ${displayText}`);
                await updatedMessagePromise;
                updatedMessagePromise = null;
            });

            // wait for message
            if (updatedMessagePromise) await updatedMessagePromise;
            // remux the audio to ogg because wav
            const outputRemuxedPath = path.join(tempDir, `ai_chatterbox_voice_remuxed.ogg`);
            await replyMessage.edit(`remuxing audio`);
            await FFmpegUtil.commands.convertToSafeOgg(outputPathAITTS, outputRemuxedPath);

            // request to SEND because chatterbox is unpredictable
            if (needToRequestApproval) {
                await replyMessage.edit("# haha we need to approve Chatterbox AGAIN"
                    + "\n" + "Please wait for your Chatterbox to be accepted. (this time you aren't in trouble)"
                    + "\n" + "- You may be denied if im not currently active"
                    + "\n" + "- The audio will be denied if Chatterbox said something inappropriate or offensive (probably not your fault)");

                const requestDetails = `AI Chatterbox TTS SEND request`
                    + `\n` + `\`${ttsText.replace(/\n/g, " ")}\``;
                const accepted = await util.requestApproval(replyMessage, message, requestDetails, [outputRemuxedPath]);
                if (!accepted) return; // rejects will be handled by requestApproval
            }

            await replyMessage.edit({
                content: "Completed in " + ((Date.now() - startTime) / 1000) + " seconds"
                    + "\n" + `-# Generated by <@${message.author.id}>`,
                files: [outputRemuxedPath]
            });
        });
    }
    async invoke(message, args, util) {
        if (!env.getBool("CHATTERBOX_ENABLED")) throw new Error("Chatterbox is disabled on this system");
        const canDo = util.request("heavyExternalStuff");
        if (!canDo) return message.reply("disabled (im probably playing a game)");

        await this.handle(message, args, util);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;