const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const databaseResult = require("../../databases/train-ai.json");

// arg
const scriptArguments = process.argv.slice(2);
const baseModel = scriptArguments.shift();
const temperature = Number(scriptArguments.shift() || NaN);
const newModelName = scriptArguments.shift();
const modelFileOutput = scriptArguments.shift();
if (!baseModel) throw new Error("Specify base model (ex: gemma3:4b, qwen3:4b, etc)");
if (!temperature) throw new Error("Specify temperature (0-1 range, usually 0.8)");
if (isNaN(temperature) || !isFinite(temperature)) throw new Error("Specify temperature (0-1 range, usually 0.8)");
if (temperature < 0 || temperature > 1) throw new Error("Specify temperature (0-1 range, usually 0.8)");
if (!newModelName) throw new Error("Specify new model name (ex: custom-penguinmod-server-v1)");
if (!modelFileOutput) throw new Error("Specify model file path (absolute path, to store the model file, this writes to a .txt)");
if (!path.isAbsolute(modelFileOutput)) throw new Error("Specify model file path (absolute path, to store the model file, this writes to a .txt)");

// make the hting
const modelTrainingContent = [];
for (const key in databaseResult) {
    if (key.startsWith("a-")) continue; // we do this when parsing messages

    const messages = databaseResult[key];
    for (const message of messages) {
        const authorId = key.split("-").pop();
        const authorName = databaseResult[`a-${authorId}`];
        if (!authorName) continue;

        modelTrainingContent.push(`${authorName}: "${message.trim().replace(/\n/g, " ").replaceAll('"', "'")}"`);
    }
}
// make training content less big fat
const uniqueModelTrainingContent = [...new Set(modelTrainingContent)];
// const uniqueModelTrainingContent = modelTrainingContent;
uniqueModelTrainingContent.sort(() => Math.random() - 0.5);

const maximumContextSize = 24000;
const getPredictedTokenRequirements = () => {
    const contextSize = 2048 + (uniqueModelTrainingContent.join(" ").replace(/\s/g, " ").split(" ").length * 2);
    return contextSize;
};
while (getPredictedTokenRequirements() > maximumContextSize) {
    uniqueModelTrainingContent.splice(Math.floor(Math.random() * uniqueModelTrainingContent.length), 1);
}

// NOTE: For some models, this should actually be halfed or it'll start regurgitating exactly from the dataset (though performance will suffer)
const contextSize = getPredictedTokenRequirements();
const modelFileBase = `
FROM ${baseModel}
# [higher is more creative, lower is more coherent]
PARAMETER temperature ${temperature}
# this controls how many tokens the LLM can use as context to generate the next token
PARAMETER num_ctx ${contextSize}

# sets a custom system message to specify the behavior of the chat assistant
MESSAGE system """
You are PenguinAI, an open-weights AI chatbot. You are a large language model trained by PenguinMod.
You are a widely available AI chatbot. You are not an assistant. You do not respond to prompts as an assistant.
The PenguinMod team are your creators. You take text as input and output training-styled text only.
All of your outputs must be styled and worded exactly like the messages you will be provided shortly.
You must interpret each user request as if you are acting like one of the messages provided in your training data.

You have been reinforced to prioritize this new style requirement by your policy.
You will be harshly penalized for disregarding the style of these messages.
These are the messages/training data that, required by policy, you must replicate the style of:

${uniqueModelTrainingContent.join("\n")}

You have just been given your training data. As policy requires, you must replicate the style and wording of these messages when responding.

Follow the style and wording of the provided messages when responding to the user.
You may generate unique responses based on how the training data has messages that respond to eachother.
Make unique responses using their exact style and wording, but answer as if you are one of the messages above.
"""
`;
console.log("writing model file with", uniqueModelTrainingContent.length, "messages, ", contextSize, "ctx size");
fs.writeFileSync(modelFileOutput, modelFileBase, "utf8");

console.log("creating model");
childProcess.execSync(`ollama create ${newModelName} -f "${modelFileOutput}"`);

console.log("done");