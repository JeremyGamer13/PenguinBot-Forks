const fs = require("fs");
const path = require("path");
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

// ai generate Oh my god hes vibe coding
/**
 * Checks if a file contains at least one video stream.
 * @param {string} absolutePath - The absolute path to the file.
 * @returns {Promise<boolean>} - Resolves to true if video data exists.
 */
async function probeIsVideo(absolutePath) {
    // my security checks so random shit doesnt get passed into CLI
    if (!path.isAbsolute(absolutePath)) throw new Error("Path must be absolute");
    if (!fs.existsSync(absolutePath)) throw new Error("Cannot probe non-existent path");
    
    try {
        // -select_streams v: Look only for video
        // -show_entries stream=codec_type: Tell us the type
        // -of csv=p=0: Give us a raw string (e.g., "video") without extra text
        // we also remove album art// This command counts all video streams that are NOT marked as attached_pic
        const command = `ffprobe -v error -select_streams v -show_entries stream=index -of csv=p=0 "${absolutePath}"`;
        const { stdout } = await execPromise(command);

        const result = stdout.trim();

        // 1. If result is empty, there is no video stream at all.
        if (!result) return false;

        // 2. If result is "1", it's an attached picture (Album Art).
        if (result === '1') return false;

        // 3. If result is "0", it's a real video stream.
        return result === '0';
    } catch (error) {
        // If the file is corrupt or not a media file, ffprobe returns an error code
        return false;
    }
}

module.exports = probeIsVideo;