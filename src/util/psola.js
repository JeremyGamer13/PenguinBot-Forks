const fs = require("fs");
const path = require("path");
const nodeUtil = require("util");
const childProcess = require("child_process");

const env = require("./env-util.js");
const execPromise = nodeUtil.promisify(childProcess.exec);

class PSOLA {
    /**
     * Pitch-correct an entire sample to a frequency.
     * @param {string} absolutePathInput 
     * @param {string} absolutePathOutput .wav file path. will be deleted if it already exists to prevent any app/local-api issues
     * @param {number} frequency the target frequency (see resources/key-frequency.json)
     * @returns {Promise<void>} absolutePathOutput will be the result
     */
    static async pitchCorrect(absolutePathInput, absolutePathOutput, frequency) {
        if (!env.getBool("PSOLA_ENABLED")) throw new Error("PSOLA is disabled on this system");
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Input cannot be non-existent path");
        if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");

        if (typeof frequency !== "number") throw new Error("Invalid frequency");
        if (isNaN(frequency)) throw new Error("Invalid frequency");
        if (!isFinite(frequency)) throw new Error("Invalid frequency");

        if (fs.existsSync(absolutePathOutput)) {
            fs.rmSync(absolutePathOutput, { force: true });
        }

        const command = `${env.get("PSOLA_PYTHON")}`
            .replaceAll("{{TASK}}", `pitchcorrect`)
            .replaceAll("{{INPUT}}", `"${absolutePathInput}"`)
            .replaceAll("{{OUTPUT}}", `"${absolutePathOutput}"`)
            .replaceAll("{{FREQUENCY}}", `${frequency}`);
        await execPromise(command, {
            cwd: env.get("PSOLA_PATH")
        });
    }
}

module.exports = PSOLA;
