const fs = require("fs");
const path = require("path");
const nodeUtil = require("util");
const childProcess = require("child_process");

const env = require("./env-util");
const execPromise = nodeUtil.promisify(childProcess.exec);

class Stammer {
    static async stammer(absolutePathCarrier, absolutePathModulator, absolutePathOutput) {
        // my security checks so random shit doesnt get passed into CLI
        if (!path.isAbsolute(absolutePathCarrier)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathCarrier)) throw new Error("Carrier cannot be non-existent path");
        if (!path.isAbsolute(absolutePathModulator)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathModulator)) throw new Error("Modulator cannot be non-existent path");
        if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");
        // if (!fs.existsSync(absolutePathOutput)) throw new Error("Cannot create non-existent path"); // thats the poiint

        const command = `${env.get("STAMMER_PYTHON")}`
            .replaceAll("{{CARRIER}}", `"${absolutePathCarrier}"`)
            .replaceAll("{{MODULATOR}}", `"${absolutePathModulator}"`)
            .replaceAll("{{OUTPUT}}", `"${absolutePathOutput}"`);
        await execPromise(command, {
            cwd: env.get("STAMMER_PATH")
        });
    }
}

module.exports = Stammer;