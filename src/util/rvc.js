const fs = require("fs");
const path = require("path");
const {default:slash} = require("slash");
const nodeUtil = require("util");
const childProcess = require("child_process");

const env = require("./env-util");
const execPromise = nodeUtil.promisify(childProcess.exec);

class RVC {
    /**
     * Make inference with RVC
     * @param {string} absolutePathInput 
     * @param {string} absoluteModelPath absolute path to the .pth file of the model you want to use
     * @param {string} absoluteIndexPath absolute path to the .index file of the model you want to use
     * @param {string} absolutePathOutput will be deleted if it already exists to prevent any app/local-api issues
     * @param {"rmvpe"|"crepe"|"crepe-tiny"|"fcpe"|null} f0method probably just use rmvpe low key
     * @param {number?} semitones how many semitones to shift by, use smth like -12 or 12 to go -1 or +1 octave
     * @returns {Promise<void>} absolutePathOutput will be the result
     */
    static async infer(absolutePathInput, absoluteModelPath, absoluteIndexPath, absolutePathOutput, f0method = "rmvpe", semitones = 0) {
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Input cannot be non-existent path");
        if (!path.isAbsolute(absoluteModelPath)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absoluteModelPath)) throw new Error("Model path cannot be non-existent path");
        if (!path.isAbsolute(absoluteIndexPath)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absoluteIndexPath)) throw new Error("Index cannot be non-existent path");
        if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");

        if (fs.existsSync(absolutePathOutput)) {
            fs.rmSync(absolutePathOutput, { force: true });
        }

        const command = `${env.get("RVC_PYTHON")}`
            .replaceAll("{{METHOD}}", `${f0method}`)
            .replaceAll("{{SEMITONES}}", `${semitones}`)
            .replaceAll("{{MODEL}}", `"${absoluteModelPath}"`)
            .replaceAll("{{INDEX}}", `"${absoluteIndexPath}"`)
            .replaceAll("{{INPUT}}", `"${absolutePathInput}"`)
            .replaceAll("{{OUTPUT}}", `"${absolutePathOutput}"`)
        await execPromise(command, {
            cwd: env.get("RVC_PATH")
        });
    }
}

module.exports = RVC;