const fs = require("fs");
const path = require("path");
const nodeUtil = require("util");
const childProcess = require("child_process");

const getFileSize = require('./file-size');

const execPromise = nodeUtil.promisify(childProcess.exec);

const compatibleAudio = [
    "3g2", "3gp", "4xm", "aa", "aac", "ac3", "ac4", "adts", "adx", "aea",
    "afc", "aiff", "alaw", "amr", "ape", "asf", "ast", "au", "avi", "basic",
    "bit", "caf", "codec2", "dash+xml", "daud", "dts", "dv", "eac3", "flac",
    "flv", "g722", "g723", "g726", "g729", "gsm", "hls", "ilbc", "ircam",
    "iss", "l16", "latm", "lrc", "m4a", "matroska", "midi", "mmf", "mov",
    "mp1", "mp2", "mp3", "mp4", "mpc", "mpeg", "mpeg3", "mpegts", "mulaw",
    "mxf", "oga", "ogg", "oma", "opus", "pcm", "qcelp", "rm", "rmf", "rtp",
    "rtsp", "sbg", "shn", "sox", "speex", "tak", "tta", "vnd.dlna.adts",
    "vnd.rn-realaudio", "vnd.smaf", "voc", "wav", "wave", "webm", "w64",
    "wma", "wv", "xa", "x-aac", "x-ac3", "x-adpcm", "x-aiff", "x-caf",
    "x-dca", "x-eac3", "x-flac", "x-gsm", "x-m4a", "x-matroska", "x-midi",
    "x-mod", "x-mp3", "x-mpeg", "x-mpeg3", "x-ms-asf", "x-ms-wma",
    "x-pn-realaudio", "x-pn-wav", "x-rmf", "x-speex", "x-vorbis+ogg",
    "x-wav", "xwma"
];
const compatibleVideo = [
    "3gpp", "3gpp2", "av1", "avi", "divx", "dv", "f4v", "fli", "flv", "gxf",
    "h261", "h263", "h263-1998", "h263-2000", "h264", "h265", "hevc", "ivf",
    "m4v", "mj2", "mjp2", "mkv", "mov", "mp2t", "mp4", "mp4v-es", "mpeg",
    "mpeg2", "mpeg4", "mpeg4-generic", "mpegts", "mxf", "nut", "ogg", "ogv",
    "quicktime", "rawvideo", "vc1", "vnd.dlna.mpeg-tts", "vnd.rn-realvideo",
    "vnd.vivo", "vp8", "vp9", "webm", "wmv", "x-f4v", "x-fli", "x-flv",
    "x-h264", "x-h265", "x-m4v", "x-matroska", "x-mjp2", "x-mpeg", "x-mpeg2",
    "x-mpegts", "x-ms-asf", "x-ms-wmv", "x-msvideo", "x-nut", "x-ogm",
    "x-pn-realvideo", "x-sgi-movie", "x-yuv4mpegpipe"
];

class FFmpegUtil {
    // not really exec calls
    static isCompatibleAudio(mimeEnding) {
        return compatibleAudio.includes(mimeEnding);
    }
    static isCompatibleVideo(mimeEnding) {
        return compatibleVideo.includes(mimeEnding);
    }

    // ffprobe light
    // ai generate Oh my god hes vibe coding
    /**
     * Gets the duration of a media file (video or audio) in seconds.
     * @param {string} absolutePath - The full path to the file.
     * @returns {Promise<number>} - The duration in seconds.
     */
    static async probeLength(absolutePath) {
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
    // ai generate Oh my god hes vibe coding
    /**
     * Checks if a file contains at least one video stream.
     * @param {string} absolutePath - The absolute path to the file.
     * @returns {Promise<boolean>} - Resolves to true if video data exists.
     */
    static async probeIsVideo(absolutePath) {
        // my security checks so random shit doesnt get passed into CLI
        if (!path.isAbsolute(absolutePath)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePath)) throw new Error("Cannot probe non-existent path");

        try {
            // this command seems to work fully in CLI soo yeah copy and paste
            // We ask for: codec_name AND the attached_pic flag
            // Format: h264,0 (for real video) or mjpeg,1 (for album art)
            const command = `ffprobe -v error -select_streams v -show_entries stream=codec_name:disposition=attached_pic -of csv=p=0 "${absolutePath}"`;

            const { stdout } = await execPromise(command);
            const lines = stdout.trim().split('\n');

            // Check every video stream found
            for (const line of lines) {
                if (!line) continue;

                // CSV format: codec_name,attached_pic_flag
                // Example: "h264,0" or "mjpeg,1"
                const [codec, isAttachedPic] = line.split(',');

                // If it's NOT an attached picture (isAttachedPic === '0'), it's a real video stream
                if (isAttachedPic === '0') {
                    return true;
                }
            }

            return false; // No video streams, or only album art found
        } catch (error) {
            // If the file is corrupt or not a media file, ffprobe returns an error code
            return false;
        }
    }

    // ffprobe heavy

    
    // ffmpeg light
    static async convertToSafeOgg(absolutePathInput, absolutePathOutput) {
        // my security checks so random shit doesnt get passed into CLI
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Cannot convert non-existent path");
        if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");
        // if (!fs.existsSync(absolutePathOutput)) throw new Error("Cannot create non-existent path"); // thats the poiint

        const command = `ffmpeg -y -i "${absolutePathInput}" -map_metadata -1 -vn -c:a libvorbis "${absolutePathOutput}"`;
        await execPromise(command);
    }
    static async convertToSafeMp3(absolutePathInput, absolutePathOutput) {
        // my security checks so random shit doesnt get passed into CLI
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Cannot convert non-existent path");
        if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");
        // if (!fs.existsSync(absolutePathOutput)) throw new Error("Cannot create non-existent path"); // thats the poiint

        const command = `ffmpeg -y -i "${absolutePathInput}" -map_metadata -1 -vn -c:a libmp3lame "${absolutePathOutput}"`;
        await execPromise(command);
    }
    static async convertToSafeMp4(absolutePathInput, absolutePathOutput) {
        // my security checks so random shit doesnt get passed into CLI
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Cannot convert non-existent path");
        if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");
        // if (!fs.existsSync(absolutePathOutput)) throw new Error("Cannot create non-existent path"); // thats the poiint

        const command = `ffmpeg -y -i "${absolutePathInput}" -c:v libx264 -c:a aac -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${absolutePathOutput}"`;
        await execPromise(command);
    }

    static async convertToSafeVideoOrAudio(absolutePathInput, makeAbsolutePathOutput) {
        if (await this.probeIsVideo(absolutePathInput)) {
            const outputPath = makeAbsolutePathOutput("mp4");
            await this.convertToSafeMp4(absolutePathInput, outputPath);
            return outputPath;
        }
        const outputPath = makeAbsolutePathOutput("ogg");
        await this.convertToSafeOgg(absolutePathInput, outputPath);
        return outputPath;
    }

    // ai generate Ohhj my god hes vibe coding
    static async mixAudio(absolutePathInput, absolutePathInput2, absolutePathOutput, volumeAdjustment = 1) {
        // my security checks so random shit doesnt get passed into CLI
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Cannot convert non-existent path");
        if (!path.isAbsolute(absolutePathInput2)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput2)) throw new Error("Cannot add non-existent path");
        if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");

        // Logic:
        // [1:a]volume=${volumeAdjustment2}[louder2] -> Take input 2, adjust volume, name the result "louder2"
        // [0:a][louder2]amix=inputs=2 -> Mix input 1 and our "louder2" stream
        const filter = `[1:a]volume=${volumeAdjustment}[louder2];[0:a][louder2]amix=inputs=2:duration=longest`;

        // We wrap paths in double quotes to prevent errors with spaces in filenames.
        // amix=inputs=2 combines the streams.
        const command = `ffmpeg -y -i "${absolutePathInput}" -i "${absolutePathInput2}" -filter_complex "${filter}" "${absolutePathOutput}"`;
        await execPromise(command);
    }
    
    // ffmpeg heavy
    // ai generate Ohhj my god hes vibe coding
    /**
     * Compresses a video to a target size using a calculated bitrate.
     * @param {string} input - Path to source video
     * @param {string} output - Path for output mp4
     * @param {number} targetSizeBytes - Desired file size in bytes
     */
    static async dynamicallyCompressToMp4(absolutePathInput, absolutePathOutput, targetSizeBytes) {
        // my security checks so random shit doesnt get passed into CLI
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Cannot convert non-existent path");
        if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");

        const currentSizeBytes = await getFileSize(absolutePathInput);
        const durationSeconds = await this.probeLength(absolutePathInput);

        // 1. Calculate the required bitrate in bits per second (bps)
        // Formula: (Target Bytes * 8) / Duration
        // We multiply by 0.9 to leave a 10% buffer for audio and container overhead.
        const totalBitsAvailable = targetSizeBytes * 8;
        const targetBitrateBps = Math.floor((totalBitsAvailable / durationSeconds) * 0.9);

        // Convert to kbps for the FFmpeg flag (FFmpeg likes 'k' suffix)
        const targetBitrateKbs = Math.floor(targetBitrateBps / 1000);

        // 2. Determine "Preset" speed based on the compression gap.
        const compressionRatio = currentSizeBytes / targetSizeBytes;
        let preset = 'medium';

        if (compressionRatio > 4) {
            preset = 'slower';
        } else if (compressionRatio > 2) {
            preset = 'slow';
        }

        // 3. Construct the FFmpeg command
        // Note: If targetBitrateKbs is extremely low (e.g., < 100), the video will look like Lego bricks.
        // We ensure a minimum of 64k just so it doesn't completely error out.
        const safeBitrate = Math.max(targetBitrateKbs, 64);

        const command = [
            'ffmpeg -y',
            `-i "${absolutePathInput}"`,
            '-c:v libx264',
            `-b:v ${safeBitrate}k`,
            `-maxrate ${Math.floor(safeBitrate * 1.5)}k`,
            `-bufsize ${safeBitrate * 2}k`,
            `-preset ${preset}`,
            '-c:a aac',
            '-b:a 128k',
            `"${absolutePathOutput}"`
        ].join(' ');
        await execPromise(command);
    }
    // ai generate Ohhj my god hes vibe coding
    /**
     * Compresses a video while mixing its original audio with a backing track.
     * This is probably only useful for like 1 command but i dont care lole
     * @param {string} absolutePathInput - Path to source video
     * @param {string} absolutePathBacking - Path to audio backing track (mp3/wav/etc)
     * @param {string} absolutePathOutput - Path for output mp4
     * @param {number} targetSizeBytes - Desired file size in Bytes
     */
    static async dynamicallyCompressToMp4WithBackingTrack(absolutePathInput, absolutePathBacking, absolutePathOutput, targetSizeBytes) {
        // my security checks so random shit doesnt get passed into CLI
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Cannot convert non-existent path");
        if (!path.isAbsolute(absolutePathBacking)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathBacking)) throw new Error("Cannot add non-existent path");
        if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");

        const durationSeconds = await this.probeLength(absolutePathInput);

        // 1. Bitrate Math (identical to previous version)
        // We stick with the 0.9 buffer to account for the muxing overhead
        const totalBitsAvailable = targetSizeBytes * 8;
        const targetBitrateBps = Math.floor((totalBitsAvailable / durationSeconds) * 0.9);
        const targetBitrateKbs = Math.max(Math.floor(targetBitrateBps / 1000), 64);

        // 2. Determine Preset
        const currentSizeBytes = await getFileSize(absolutePathInput);
        const compressionRatio = currentSizeBytes / targetSizeBytes;
        let preset = compressionRatio > 4 ? 'slower' : (compressionRatio > 2 ? 'slow' : 'medium');

        // 3. Construct the Audio-Mixing FFmpeg command
        // [0:a] is video audio, [1:a] is backing track. 
        // amix=inputs=2:duration=shortest mixes them and crops to the video length.
        const command = [
            'ffmpeg -y',
            `-i "${absolutePathInput}"`,
            `-i "${absolutePathBacking}"`,
            '-filter_complex "[0:a][1:a]amix=inputs=2:duration=shortest[aout]"',
            '-map 0:v',         // Map the video from the first input
            '-map "[aout]"',    // Map the mixed audio result
            '-c:v libx264',
            `-b:v ${targetBitrateKbs}k`,
            `-maxrate ${Math.floor(targetBitrateKbs * 1.5)}k`,
            `-bufsize ${targetBitrateKbs * 2}k`,
            `-preset ${preset}`,
            '-c:a aac',
            '-b:a 128k',
            `"${absolutePathOutput}"`
        ].join(' ');
        await execPromise(command);
    }
}

module.exports = FFmpegUtil;