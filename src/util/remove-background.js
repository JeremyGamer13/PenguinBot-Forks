const fs = require("fs");
const path = require("path");
const {default:slash} = require("slash");
const nodeUtil = require("util");
const childProcess = require("child_process");

const env = require("./env-util");
const execPromise = nodeUtil.promisify(childProcess.exec);

class RemoveBackground {
    /**
     * Remove the background from an input image
     * @param {string} absolutePathInput 
     * @param {string} absolutePathOutput will be deleted if it already exists to prevent any app/local-api issues
     * @returns {Promise<void>} absolutePathOutput will be the result
     */
    static async remove(absolutePathInput, absolutePathOutput) {
        if (!env.getBool("REMOVEBACKGROUND_ENABLED")) throw new Error("RemoveBackground is disabled on this system");
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Input cannot be non-existent path");
        if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");

        if (fs.existsSync(absolutePathOutput)) {
            fs.rmSync(absolutePathOutput, { force: true });
        }

        const command = `${env.get("REMOVEBACKGROUND_PYTHON")}`
            .replaceAll("{{INPUT}}", `"${absolutePathInput}"`)
            .replaceAll("{{OUTPUT}}", `"${absolutePathOutput}"`)
        await execPromise(command, {
            cwd: env.get("REMOVEBACKGROUND_PATH")
        });
    }
}

module.exports = RemoveBackground;