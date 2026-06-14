const fs = require("fs");
const path = require("path");
const nodeUtil = require("util");
const childProcess = require("child_process");

const env = require("./env-util");

class ObjectDetection {
    /**
     * @typedef {Object} PredictionBox
     * @property {number[]} box [x1, y1, x2, y2]
     * @property {number} score confidence of the ai model
     * @property {string} term which specific term/subterm the AI model was hyper-focused on
     */
    /**
     * @typedef {Object.<string, PredictionBox[]>} PredictionResult
     */
    /**
     * Detect bounding boxes for specified objects/classes
     * @param {string} absolutePathInput absolute path to the image you want to use
     * @param {string[]} classes which objects you are looking for (ie, ["left eye", "right eye", "dog", "table", "person"])
     * @returns {Promise<PredictionResult>}
     */
    static predict(absolutePathInput, classes) {
        if (!env.getBool("OBJDETECT_ENABLED")) throw new Error("ObjectDetection is disabled on this system");
        if (!path.isAbsolute(absolutePathInput)) throw new Error("Path must be absolute");
        if (!fs.existsSync(absolutePathInput)) throw new Error("Input cannot be non-existent path");

        const executable = env.get("OBJDETECT_PYTHON_EXEC");
        const modelPath = env.get("OBJDETECT_PATH_MODEL");
        const pythonProgram = env.get("OBJDETECT_PYTHON_CODE");
        const serializedClasses = JSON.stringify(classes);
        return new Promise(async (resolve, reject) => {
            const process = childProcess.spawn(executable, [
                pythonProgram,
                "--input",
                absolutePathInput,
                "--model",
                modelPath,
            ], {
                cwd: env.get("OBJDETECT_PATH")
            });
            process.stdin.setEncoding('utf8');
            process.stderr.setEncoding('utf8');
            process.stdout.setEncoding('utf8');

            process.stdin.write(serializedClasses);
            process.stdin.end();

            let output = "";
            process.stdout.on("data", (data) => {
                // verbose output
                console.log(data);
                if (!data.trim().startsWith("{")) return;

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

                const resultingPrediction = output.replace(/[\r\n]/g, " ").trim();
                if (!resultingPrediction) return resolve({});
                try {
                    const parsedPrediction = JSON.parse(resultingPrediction);
                    resolve(parsedPrediction);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }
}

module.exports = ObjectDetection;