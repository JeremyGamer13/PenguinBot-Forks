const fs = require("fs");
const path = require("path");
const nodeUtil = require("util");
const childProcess = require("child_process");

const env = require("./env-util");

class Chatterbox {
    /**
     * Generate Chatterbox AI-voice-cloning TTS.
     * @param {string} text the text to speak
     * @param {string} absolutePathConditionalsPrefix The path for conditionals, being a prefix for the actual path.
     * @param {string} absolutePathOutput will be deleted if it already exists to prevent any app/local-api issues
     * @param {((currentChunk: number, chunkCount: number, currentText: string, currentTag: string) => void) | null} progressCallback A callback to run when generation progress is given back.
     * @returns {Promise<string>} returns absolutePathOutput
     */
    static generate(text, absolutePathConditionalsPrefix, absolutePathOutput, progressCallback) {
        if (!env.getBool("CHATTERBOX_ENABLED")) throw new Error("Chatterbox is disabled on this system");
        if (!path.isAbsolute(absolutePathConditionalsPrefix)) throw new Error("Path must be absolute");
        if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");

        if (fs.existsSync(absolutePathOutput)) {
            fs.rmSync(absolutePathOutput, { force: true });
        }

        const executable = env.get("CHATTERBOX_PYTHON_EXEC");
        const modelPath = env.get("CHATTERBOX_PATH_MODEL");
        const pythonProgram = env.get("CHATTERBOX_PYTHON_CODE");
        return new Promise(async (resolve, reject) => {
            const process = childProcess.spawn(executable, [
                pythonProgram,
                "--max_length",
                env.getNumber("CHATTERBOX_MAX_LENGTH"),
                "--max_chunks",
                env.getNumber("CHATTERBOX_MAX_CHUNKS"),
                "--silent",
                "--model",
                modelPath,
                "--conditionals",
                absolutePathConditionalsPrefix,
                "--output",
                absolutePathOutput,
            ], {
                cwd: env.get("CHATTERBOX_PATH")
            });
            process.stdin.setEncoding('utf8');
            process.stderr.setEncoding('utf8');
            process.stdout.setEncoding('utf8');

            process.stdin.write(text);
            process.stdin.end();

            process.stdout.on("data", (data) => {
                // verbose output
                console.log(data);

                if (!data.trim().startsWith("{")) return;
                try {
                    const packet = JSON.parse(data.trim());
                    if (packet.type !== "chunk") return;

                    progressCallback(
                        packet.current,
                        packet.length,
                        packet.text,
                        packet.active_tag,
                    );
                } catch (err) {
                    console.warn("failed Chatterbox update;", err);
                }
            });
            process.stderr.on("data", (err) => {
                console.error(err);
            });
            process.on("error", (err) => {
                reject(err);
            });

            process.on("close", (code, signal) => {
                if (code !== 0) return reject(signal);
                return resolve(absolutePathOutput);
            });
        });
    }
}

module.exports = Chatterbox;