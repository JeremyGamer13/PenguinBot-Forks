/**
 * @fileoverview Text Dataset Generator
 * This generates a text dataset from the random messages that users submit
 * You can use this dataset in QLoRA fine tuning to extend another model with the custom training data
 */
/*
V7: (CURRENT)

node scripts/make-trainai-text-dataset.js "C:\Users\Jeremy\Documents\GitHub\PenguinAI\.dev\TRAINAI-dataset.jsonl"
*/
const fs = require("fs");
const path = require("path");

const databaseResult = require("../databases/train-ai.json");

// arg
const scriptArguments = process.argv.slice(2);
const datasetOutputPath = scriptArguments.shift();
if (!datasetOutputPath) throw new Error("Specify dataset Output path (absolute path, to store the dataset Output, this writes to a .jsonl)");
if (!path.isAbsolute(datasetOutputPath)) throw new Error("Specify dataset Output path (absolute path, to store the dataset Output, this writes to a .jsonl)");

// config
console.log("making", datasetOutputPath);

// make the hting
const modelTrainingContent = [];
for (const key in databaseResult) {
    if (key.startsWith("a-")) continue; // we do this when parsing messages

    const messages = databaseResult[key];
    for (const message of messages) {
        const authorId = key.split("-").pop();
        const authorName = databaseResult[`a-${authorId}`];
        if (!authorName) continue;

        const messageContent = `${message.trim()}`;
        if (modelTrainingContent.find(snippet => snippet.content === messageContent))
            continue;

        modelTrainingContent.push({
            username: authorName,
            content: messageContent,
        });
    }
}

// shuffle
modelTrainingContent.sort(() => Math.random() - 0.5);
console.log("done cleaning", modelTrainingContent.length, "messages");

const jsonlFileContent = modelTrainingContent
    .map(snippet => JSON.stringify({ text: snippet.content }))
    .join("\n");
console.log("writing jsonl with", modelTrainingContent.length, "messages");
fs.writeFileSync(datasetOutputPath, jsonlFileContent, "utf8");
console.log("done, use unsloth or other tools to use this as a dataset");
