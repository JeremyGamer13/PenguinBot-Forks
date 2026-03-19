const fs = require("fs");
const path = require("path");
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

// ai generate Oh my god hes vibe coding
/**
 * Gets the duration of a media file (video or audio) in seconds.
 * @param {string} absolutePath - The full path to the file.
 * @returns {Promise<number>} - The duration in seconds.
 */
async function probeLength(absolutePath) {
    // my security checks so random shit doesnt get passed into CLI
    if (!path.isAbsolute(absolutePath)) throw new Error("Path must be absolute");
    if (!fs.existsSync(absolutePath)) throw new Error("Cannot probe non-existent path");
    // -v error: Hide logs except errors
    // -show_entries: Only fetch the 'duration' field
    // -of default=noprint_wrappers=1:noprint_key=1: Output only the value, no keys You liar that doesnt work im Killing youi
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 "${absolutePath}"`;

    try {
        const { stdout } = await execPromise(command);
        const output = stdout.trim();
        const duration = Number(output.split("=").slice(1, 2));

        if (isNaN(duration)) {
            throw new Error("Could not parse duration from ffprobe output.");
        }

        return duration;
    } catch (error) {
        throw new Error(`FFprobe failed: ${error.message}`);
    }
}

module.exports = probeLength;