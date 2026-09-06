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
     * @param {string?} configPath .cfg load and execute a configuration file containing fluidsynth related shell commands
     * @returns {Promise<void>} absolutePathOutput will be the result
     */
    static async renderMidi(absolutePathInput, absolutePathOutput, soundFontPath, configPath) {
        if (!env.getBool("FLUIDSYNTH_ENABLED")) throw new Error("FluidSynth is disabled on this system");
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Input cannot be non-existent path");
        if (!path.isAbsolute(soundFontPath)) throw new Error("Path must be absolute");
        if (!fs.existsSync(soundFontPath)) throw new Error("soundFontPath cannot be non-existent path");
        if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");
        if (configPath) {
            if (!fs.existsSync(configPath)) throw new Error("configPath cannot be non-existent path");
            if (!path.isAbsolute(configPath)) throw new Error("Path must be absolute");
        }

        if (fs.existsSync(absolutePathOutput)) {
            fs.rmSync(absolutePathOutput, { force: true });
        }

        const command = `${env.get("FLUIDSYNTH_EXEC")}${configPath ? (" " + `-f "${slash(configPath)}"`) : ""} -g 1 -ni --fast-render="${slash(absolutePathOutput)}" "${slash(soundFontPath)}" "${slash(absolutePathInput)}"`;
        await execPromise(command);
    }
}

module.exports = FluidSynth;
