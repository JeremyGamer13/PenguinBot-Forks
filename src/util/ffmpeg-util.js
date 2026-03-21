const fs = require("fs");
const path = require("path");
const nodeUtil = require("util");
const childProcess = require("child_process");

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

// TODO: centralize generic stuff like mp3 & mp4 fixing here
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

    // ffprobe heavy

    
    // ffmpeg light
    static async convertToSafeOgg(absolutePathInput, absolutePathOutput) {
        // my security checks so random shit doesnt get passed into CLI
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Cannot convert non-existent path");
        if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");
        // if (!fs.existsSync(absolutePathOutput)) throw new Error("Cannot create non-existent path"); // thats the poiint

        const command = `ffmpeg -y -i "${absolutePathInput}" -c:a libvorbis "${absolutePathOutput}"`;
        await execPromise(command);
    }
    static async convertToSafeMp3(absolutePathInput, absolutePathOutput) {
        // my security checks so random shit doesnt get passed into CLI
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Cannot convert non-existent path");
        if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");
        // if (!fs.existsSync(absolutePathOutput)) throw new Error("Cannot create non-existent path"); // thats the poiint

        const command = `ffmpeg -y -i "${absolutePathInput}" -c:a libmp3lame "${absolutePathOutput}"`;
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
    
    // ffmpeg heavy

    
}

module.exports = FFmpegUtil;