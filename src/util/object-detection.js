const fs = require("fs");
const path = require("path");
const nodeUtil = require("util");
const childProcess = require("child_process");

const env = require("./env-util");

class ObjectDetection {
    // TODO: Grounding DINO seems to attach subterms to larger terms. We should probably scan each object individually and then save the specific terms that Grounding DINO extracted into the box data
    // TODO: Return { box: [x1,y1,x2,y2], score:number, term:string } instead
    /**
     * @typedef {Object.<string, number[][]>} PredictionResult
     * Each box is [x1, y1, x2, y2, score]
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
        const pythonProgram = env.get("OBJDETECT_PYTHON_CODE");
        const serializedClasses = JSON.stringify(classes);
        return new Promise(async (resolve, reject) => {
            const process = childProcess.spawn(executable, [
                pythonProgram,
                "--input",
                absolutePathInput
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
                console.log("REMOVETHIS LATER,", data);
                if (!data.trim().startsWith("{")) return; // verbose output
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

module.exports = ObjectDetection;