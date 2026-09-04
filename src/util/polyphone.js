const fs = require("fs");
const path = require("path");
const nodeUtil = require("util");
const { default: slash } = require("slash");
const childProcess = require("child_process");

const env = require("./env-util.js");
const execPromise = nodeUtil.promisify(childProcess.exec);

class Polyphone {
    /**
     * Convert a .sf2, .sf3, .sfz to 
     * @param {string} absolutePathInput .mid/.midi
     * @param {string} absolutePathOutput .wav file path. will be deleted if it already exists to prevent any app/local-api issues
     * @param {string} soundFontPath .sf2/.sf3/.dls
     * @returns {Promise<void>} absolutePathOutput will be the result
     */
    static async convert(absolutePathInput, absolutePathOutput, soundFontPath) {
        // if (!env.getBool("POLYPHONE_ENABLED")) throw new Error("Polyphone is disabled on this system");
        // if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        // if (!fs.existsSync(absolutePathInput)) throw new Error("Input cannot be non-existent path");
        // if (!path.isAbsolute(soundFontPath)) throw new Error("Path must be absolute");
        // if (!fs.existsSync(soundFontPath)) throw new Error("soundFontPath cannot be non-existent path");
        // if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");

        // if (fs.existsSync(absolutePathOutput)) {
        //     fs.rmSync(absolutePathOutput, { force: true });
        // }

        // const command = `${env.get("FLUIDSYNTH_EXEC")} -ni --fast-render="${slash(absolutePathOutput)}" "${slash(soundFontPath)}" "${slash(absolutePathInput)}"`;
        // await execPromise(command);
        throw new Error("Unimplemented");
    }
}

module.exports = Polyphone;
