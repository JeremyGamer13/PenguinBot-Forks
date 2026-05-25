const fs = require("fs");
const path = require("path");
const nodeUtil = require("util");
const childProcess = require("child_process");

const env = require("./env-util");
const execPromise = nodeUtil.promisify(childProcess.exec);

// Is this name TUFF; Yes Twin
class YOLOWorld {
    /**
     * @typedef {Object.<string, number[][]>} PredictionResult
     * Each box is [x1, y1, x2, y2]
     */
    /**
     * Detect bounding boxes for specified objects/classes
     * @param {string} absolutePathInput absolute path to the image you want to use
     * @param {string[]} classes which objects you are looking for (ie, ["left eye", "right eye", "dog", "table", "person"])
     * @returns {Promise<PredictionResult>}
     */
    static predict(absolutePathInput, classes) {
        if (!env.getBool("YOLOWORLD_ENABLED")) throw new Error("YOLO-World is disabled on this system");
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Input cannot be non-existent path");

        const executable = env.get("YOLOWORLD_PYTHON_EXEC");
        const pythonProgram = env.get("YOLOWORLD_PYTHON_CODE");
        const serializedClasses = JSON.stringify(classes);
        return new Promise(async (resolve, reject) => {
            const process = childProcess.spawn(executable, [pythonProgram, "--pt", env.get("YOLOWORLD_MODEL"), "--input", absolutePathInput], {
                cwd: env.get("YOLOWORLD_PATH")
            });
            process.stdin.setEncoding('utf8');
            process.stderr.setEncoding('utf8');
            process.stdout.setEncoding('utf8');

            process.stdin.write(serializedClasses);
            process.stdin.end();

            let output = "";
            process.stdout.on("data", (data) => {
                console.log("rmeovethislater,", data);
                if (!data.trim().startsWith("{")) return; // verbose stuff from YOLO-World
                output += data;
            });
            process.stderr.on("data", (err) => {
                console.error(err);
            });
            process.on("error", (err) => {
                reject(err);
            });

            process.on("close", (code, signal) => {
                if (code !== 0) return reject(signal);

                const resultingBoxes = output.replace(/[\r\n]/g, " ").trim();
                if (!resultingBoxes) return resolve({});
                try {
                    const parsedBoxes = JSON.parse(resultingBoxes);
                    resolve(parsedBoxes);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }
}

module.exports = YOLOWorld;