const fs = require("fs");
const path = require("path");
const nodeUtil = require("util");
const { default: slash } = require("slash");
const childProcess = require("child_process");

const env = require("./env-util.js");
const execPromise = nodeUtil.promisify(childProcess.exec);

const ppTypeToArgument = {
    "sf2": "-1",
    "sf3": "-2",
    "sfz": "-3",
};

class Polyphone {
    /**
     * Convert a .sf2, .sf3, .sfz between eachother
     * @param {string} absolutePathInput .sf2, .sf3, .sfz
     * @param {string} absolutePathOutput output path. The file extension must match or this will throw. will be deleted if it already exists to prevent any app/local-api issues
     * @param {"sf2"|"sf3"|"sfz"} outputType .sf2, .sf3, .sfz
     * @returns {Promise<void>} absolutePathOutput will be the result
     */
    static async convert(absolutePathInput, absolutePathOutput, outputType) {
        if (!env.getBool("POLYPHONE_ENABLED")) throw new Error("Polyphone is disabled on this system");
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Input cannot be non-existent path");
        if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");

        // NOTE: Polyphone wants the file path *without* the file extension, so we require it to match in the helper function to ensure that the output path exists
        const extName = path.extname(absolutePathOutput);
        const polyphoneMode = ppTypeToArgument[outputType];
        if (!Object.keys(ppTypeToArgument).includes(outputType))
            throw new Error("Invalid outputType");
        if (extName.slice(1) !== outputType)
            throw new Error("Output path extension does not match outputType");

        if (fs.existsSync(absolutePathOutput)) {
            fs.rmSync(absolutePathOutput, { force: true });
        }

        const polyphoneOutputDir = path.dirname(absolutePathOutput);
        const polyphoneOutputName = path.basename(absolutePathOutput).slice(0, -extName.length);
        const command = `${env.get("POLYPHONE_EXEC")} ${polyphoneMode} -i "${slash(absolutePathInput)}" -d "${slash(polyphoneOutputDir)}" -o "${polyphoneOutputName}"`;
        await execPromise(command, {
            cwd: env.get("POLYPHONE_DIR"),
        });

        if (!fs.existsSync(absolutePathOutput))
            throw new Error("Output file likely leaked as garbage as it cannot be found");
    }
}

module.exports = Polyphone;
