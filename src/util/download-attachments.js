const fs = require("fs");
const path = require("path");

const downloadAttachments = async (attachments, makeName, directory) => {
    const outputPaths = [];
    for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        const fetchResponse = await fetch(attachment.url);
        const arrayBuffer = await fetchResponse.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        const outputPath = path.join(directory, makeName(i, attachment));

        await new Promise((resolve, reject) => {
            fs.writeFile(outputPath, fileBuffer, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        outputPaths.push(outputPath);
    }
    return outputPaths;
};

module.exports = downloadAttachments;