const fs = require("fs");
const path = require("path");
const nodeUtil = require("util");
const childProcess = require("child_process");

const env = require("./env-util");
const execPromise = nodeUtil.promisify(childProcess.exec);

class Stammer {
    static async process(absolutePathCarrier, absolutePathModulator, absolutePathOutput, secondsPerFrame) {
        if (!env.getBool("STAMMER_ENABLED")) throw new Error("stammer is disabled on this system");
        // my security checks so random shit doesnt get passed into CLI
        if (!path.isAbsolute(absolutePathCarrier)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathCarrier)) throw new Error("Carrier cannot be non-existent path");
        if (!path.isAbsolute(absolutePathModulator)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathModulator)) throw new Error("Modulator cannot be non-existent path");
        if (!path.isAbsolute(absolutePathOutput)) throw new Error("Path must be absolute");
        // if (!fs.existsSync(absolutePathOutput)) throw new Error("Cannot create non-existent path"); // thats the poiint

        if (secondsPerFrame && typeof secondsPerFrame !== "number") throw new Error("Invalid secondsPerFrame");
        if (secondsPerFrame && isNaN(secondsPerFrame)) throw new Error("Invalid secondsPerFrame");
        if (secondsPerFrame && !isFinite(secondsPerFrame)) throw new Error("Invalid secondsPerFrame");

        const command = `${env.get("STAMMER_PYTHON")}`
            .replaceAll("{{CARRIER}}", `"${absolutePathCarrier}"`)
            .replaceAll("{{MODULATOR}}", `"${absolutePathModulator}"`)
            .replaceAll("{{OUTPUT}}", `"${absolutePathOutput}"`)
            + (secondsPerFrame ? ` --custom-frame-length ${Number(secondsPerFrame)}` : " --custom-frame-length 0.016");
        await execPromise(command, {
            cwd: env.get("STAMMER_PATH")
        });
    }
}

module.exports = Stammer;