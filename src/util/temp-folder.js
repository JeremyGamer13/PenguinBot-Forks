const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const childProcess = require("child_process");

const tempFolderPath = path.join(__dirname, `../../temp/`);
class TempFolder {
    constructor(name) {
        if (!name) throw new Error("Cannot make temp folder without name");
        const tempDir = path.join(tempFolderPath, `./${name}/`);
        if (!tempDir.startsWith(tempFolderPath)) throw new Error("Temp path leads outside of temp folder");

        /** @private Should only be read with tempFolderInstance.tempDir */
        this._tempDir = tempDir;
    }
    get tempDir() {
        return this._tempDir;
    }

    /**
     * Make a unique temporary directory name to handle multiple requests at the same time
     * @param {string?} prefix anything to prepend the folder name with
     * @returns {string}
     */
    static makeTempName(prefix) {
        return `${prefix || "temp"}-${crypto.randomBytes(10).toString("hex")}`;
    }
    /** @private */
    _makeDeadName() {
        return `_dead-${crypto.randomBytes(10).toString("hex")}`;
    }

    create() {
        // mkdir recursive doesnt need to check if exists
        return new Promise((resolve, reject) => {
            fs.mkdir(this._tempDir, { recursive: true }, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }
    destroy() {
        // make sure this process doesnt get interrupted (the cleanup)
        if (!fs.existsSync(this._tempDir)) return;
        const uniqueDeathName = this._makeDeadName();
        const deathPath = path.join(tempFolderPath, uniqueDeathName + "/");
        fs.renameSync(this._tempDir, deathPath);

        // we dont need to do this on sync
        return new Promise((resolve, reject) => {
            fs.rm(deathPath, { recursive: true, force: true }, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    async createAndDestroy(callback) {
        await this.create();
        try {
            await callback(this._tempDir);
        } finally {
            // err will still be thrown but we destroy
            await this.destroy();
        }
    }
}

module.exports = TempFolder;