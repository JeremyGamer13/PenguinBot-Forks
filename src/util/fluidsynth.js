const fs = require("fs");
const path = require("path");
const nodeUtil = require("util");
const { default: slash } = require("slash");
const childProcess = require("child_process");

const env = require("./env-util.js");
const execPromise = nodeUtil.promisify(childProcess.exec);

class FluidSynth {
    /**
     * Render a MIDI file with a SoundFont
     * @param {string} absolutePathInput .mid/.midi
     * @param {string} absolutePathOutput .wav file path. will be deleted if it already exists to prevent any app/local-api issues
     * @param {string} soundFontPath .sf2/.sf3/.dls
     * @returns {Promise<void>} absolutePathOutput will be the result
     */
    static async renderMidi(absolutePathInput, absolutePathOutput, soundFontPath) {
        if (!env.getBool("FLUIDSYNTH_ENABLED")) throw new Error("FluidSynth is disabled on this system");
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Input cannot be non-existent path");
        if (!path.isAbsolute(soundFontPath)) throw new Error("Path must be absolute");
        if (!fs.existsSync(soundFontPath)) throw new Error("soundFontPath cannot be non-existent path");
        if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");

        if (fs.existsSync(absolutePathOutput)) {
            fs.rmSync(absolutePathOutput, { force: true });
        }

        const command = `${env.get("FLUIDSYNTH_EXEC")} -ni --fast-render="${slash(absolutePathOutput)}" "${slash(soundFontPath)}" "${slash(absolutePathInput)}"`;
        await execPromise(command);
    }
}

module.exports = FluidSynth;
