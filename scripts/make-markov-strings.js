/*
node scripts/make-markov-strings.js "C:\Users\Jeremy\Documents\GitHub\PenguinAI\src/resources/markov-data.json"
*/
/**
 * @fileoverview This makes a json list of strings for the markov model to use
 * NOTICE: I KNOW that markov models arent really trained or anything like that, that wording is just reused
 * because this is meant to be a fallback for the actual model
 */
//** */
const fs = require("fs");
const path = require("path");

// arg
const scriptArguments = process.argv.slice(2);
const modelFileOutput = scriptArguments.shift();
if (!modelFileOutput) throw new Error("Specify markov data path (absolute path, to store the markov data, this writes to a .json)");
if (!path.isAbsolute(modelFileOutput)) throw new Error("Specify markov data path (absolute path, to store the markov data, this writes to a .json)");

const databaseResult = require("../databases/train-ai.json");
const modelTrainingContent = [];
const usernames = [];
for (const key in databaseResult) {
    if (key.startsWith("a-")) continue; // we do this when parsing messages

    const messages = databaseResult[key];
    for (const message of messages) {
        const authorId = key.split("-").pop();
        const authorName = databaseResult[`a-${authorId}`];
        if (!authorName) continue;

        if (!usernames.includes(authorName)) usernames.push(authorName);
        const trainingString = `${message.trim().replace(/\n/g, " ").replaceAll('"', "'")}`;
        if (!modelTrainingContent.includes(trainingString)) modelTrainingContent.push(trainingString);
    }
}

// sort for fun
usernames.sort();
modelTrainingContent.sort();

const outputJson = {
    usernames,
    content: modelTrainingContent,
};

console.log("writing markov data with", modelTrainingContent.length, "strings, ", usernames.length, "usernames");
fs.writeFileSync(modelFileOutput, JSON.stringify(outputJson, null, 4), "utf8");