const fs = require("fs");
const path = require("path");
const {default:slash} = require("slash");
const nodeUtil = require("util");
const childProcess = require("child_process");

const env = require("./env-util");
const execPromise = nodeUtil.promisify(childProcess.exec);

class Demucs {
    /**
     * Splits the instrumental and vocal stems into 2 wav files, which are dumped into the tempDir provided
     * @param {string} absolutePathInput 
     * @param {string} tempDir Files will be dumped in here for use by the program since Demucs makes a mess
     * @returns {Promise<[string, string]>} instrumental path, vocals path
     */
    static async splitVocals(absolutePathInput, tempDir) {
        if (!env.getBool("DEMUCS_ENABLED")) throw new Error("Demucs is disabled on this system");
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Input cannot be non-existent path");
        if (!path.isAbsolute(tempDir)) throw new Error("Path must be absolute");
        if (!fs.existsSync(tempDir)) throw new Error("tempDir cannot be non-existent path");

        const demucsExec = env.get("DEMUCS_EXECUTABLE");

        // DISCLOSURE: Ohh my god hes vibe coding (kind of not really)
        // --- Execution ---
        // Get the filename without extension to predict Demucs output folder
        const songName = path.basename(absolutePathInput, path.extname(absolutePathInput));
        const modelName = "htdemucs";

        // Run Demucs
        // --two-stems=vocals: Splits into 'vocals.wav' and 'no_vocals.wav' (the instrumental)
        // Demucs gets picky with \\ idk why so just using slash
        await execPromise(`${demucsExec} -n ${modelName} --two-stems=vocals -o "${slash(tempDir)}" "${slash(absolutePathInput)}"`);

        // --- Final Output Variables ---
        // Demucs outputs to: [tempDir]/[modelName]/[songName]/
        const outputPathVocals = path.join(tempDir, modelName, songName, "vocals.wav");
        const outputPathInst = path.join(tempDir, modelName, songName, "no_vocals.wav");
        return [outputPathInst, outputPathVocals];
    }

    /**
     * Splits the audio into 4 wav files: drums, bass, "other", vocals; which are dumped into the tempDir provided
     * @param {string} absolutePathInput 
     * @param {string} tempDir Files will be dumped in here for use by the program since Demucs makes a mess
     * @returns {Promise<[string, string, string, string]>} paths in order of drums, bass, "other", vocals
     */
    static async splitStems(absolutePathInput, tempDir) {
        if (!env.getBool("DEMUCS_ENABLED")) throw new Error("Demucs is disabled on this system");
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Input cannot be non-existent path");
        if (!path.isAbsolute(tempDir)) throw new Error("Path must be absolute");
        if (!fs.existsSync(tempDir)) throw new Error("tempDir cannot be non-existent path");

        const demucsExec = env.get("DEMUCS_EXECUTABLE");

        // DISCLOSURE: Ohh my god hes vibe coding (kind of not really)
        // --- Execution ---
        // Get the filename without extension to predict Demucs output folder
        const songName = path.basename(absolutePathInput, path.extname(absolutePathInput));
        const modelName = "htdemucs";

        // Run Demucs
        // Demucs gets picky with \\ idk why so just using slash
        await execPromise(`${demucsExec} -n ${modelName} -o "${slash(tempDir)}" "${slash(absolutePathInput)}"`);

        const outputPathDrums = path.join(tempDir, modelName, songName, "drums.wav");
        const outputPathBass = path.join(tempDir, modelName, songName, "bass.wav");
        const outputPathOther = path.join(tempDir, modelName, songName, "other.wav");
        const outputPathVocals = path.join(tempDir, modelName, songName, "vocals.wav");
        return [outputPathDrums, outputPathBass, outputPathOther, outputPathVocals];
    }
    /**
     * Splits the audio into 6 wav files: drums, bass, "other", guitar, piano (dirty), vocals; which are dumped into the tempDir provided
     * @param {string} absolutePathInput 
     * @param {string} tempDir Files will be dumped in here for use by the program since Demucs makes a mess
     * @returns {Promise<[string, string, string, string, string, string]>} paths in order of drums, bass, "other", guitar, piano (dirty), vocals
     */
    static async split6Stems(absolutePathInput, tempDir) {
        if (!env.getBool("DEMUCS_ENABLED")) throw new Error("Demucs is disabled on this system");
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Input cannot be non-existent path");
        if (!path.isAbsolute(tempDir)) throw new Error("Path must be absolute");
        if (!fs.existsSync(tempDir)) throw new Error("tempDir cannot be non-existent path");

        const demucsExec = env.get("DEMUCS_EXECUTABLE");

        // DISCLOSURE: Ohh my god hes vibe coding (kind of not really)
        // --- Execution ---
        // Get the filename without extension to predict Demucs output folder
        const songName = path.basename(absolutePathInput, path.extname(absolutePathInput));
        const modelName = "htdemucs_6s";

        // Run Demucs
        // Demucs gets picky with \\ idk why so just using slash
        await execPromise(`${demucsExec} -n ${modelName} -o "${slash(tempDir)}" "${slash(absolutePathInput)}"`);

        const outputPathDrums = path.join(tempDir, modelName, songName, "drums.wav");
        const outputPathBass = path.join(tempDir, modelName, songName, "bass.wav");
        const outputPathOther = path.join(tempDir, modelName, songName, "other.wav");
        const outputPathGuitar = path.join(tempDir, modelName, songName, "guitar.wav");
        const outputPathPiano = path.join(tempDir, modelName, songName, "piano.wav");
        const outputPathVocals = path.join(tempDir, modelName, songName, "vocals.wav");
        return [outputPathDrums, outputPathBass, outputPathOther, outputPathGuitar, outputPathPiano, outputPathVocals];
    }
}

module.exports = Demucs;