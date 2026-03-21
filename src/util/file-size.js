const fs = require("fs");
const path = require("path");

/**
 * gets file size in bytes
 * @param {string} absolutePath 
 * @returns {Promise<number>}
 */
const getFileSize = (absolutePath) => {
    if (!path.isAbsolute(absolutePath)) throw new Error("Path must be absolute");
    return new Promise((resolve, reject) => {
        fs.stat(absolutePath, (err, stats) => {
            if (err) return reject(err);
            resolve(stats.size);
        });
    });
};

module.exports = getFileSize;