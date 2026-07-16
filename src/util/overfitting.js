const Database = require('sync-json-database');
const TrainingDatabase = new Database('./databases/train-ai.json');

// DISCLOSURE: these 2 functions are ai code
const createNgramIndex = (trainingData, n = 4) => {
    const trainingNgrams = new Set();

    trainingData.forEach(text => {
        // Normalize: lowercase and remove punctuation
        const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
        for (let i = 0; i <= words.length - n; i++) {
            trainingNgrams.add(words.slice(i, i + n).join(' '));
        }
    });

    return trainingNgrams;
}
/**
 * Checks for matches against the precomputed index.
 */
const checkOverfitting = (ngramIndex, aiString, n = 4) => {
    const aiWords = aiString.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);

    for (let i = 0; i <= aiWords.length - n; i++) {
        const sequence = aiWords.slice(i, i + n).join(' ');
        if (ngramIndex.has(sequence)) {
            return true;
        }
    }
    return false;
}

// presetup the dataset to check for overfitting
const datasetRawMessages = TrainingDatabase.array("keys")
    .filter(key => key.startsWith("m-"))
    .map(key => TrainingDatabase.get(key))
    .flat(Infinity);
const datasetAuthors = TrainingDatabase.array("keys")
    .filter(key => key.startsWith("a-"))
    .map(key => TrainingDatabase.get(key).toLowerCase());
const ngramLoose = { index: createNgramIndex(datasetRawMessages, 8), n: 8 };
const ngramStrict = { index: createNgramIndex(datasetRawMessages, 3), n: 3 };

/**
 * Whether or not the response can be found in the dataset.
 * @param {string} response A response from PenguinAI
 * @returns {boolean}
 */
const isOverfitting = (response = "") => {
    // be more sensitive if the response also contains a username
    const responses = response.split("\n");
    for (const response of responses) {
        const colonChar = response.indexOf(":");
        const username = colonChar === -1 ? "" : response.slice(0, colonChar);
        if (username && datasetAuthors.includes(username.toLowerCase())) {
            const overfitting = checkOverfitting(ngramStrict.index, response, ngramStrict.n);
            if (overfitting) return true;
        }

        const overfitting = checkOverfitting(ngramLoose.index, response, ngramLoose.n);
        if (overfitting) return true;
    }

    return false;
}

/**
 * Appends the overfitting warning to the response if detected.
 * @param {string} response A response from PenguinAI
 * @returns {string}
 */
const appendOverfitting = (response = "") => {
    const likelyOverfitting = this.isResponseOverfitting(response);
    const overfittingWarning = "\n-# This response is likely regurgitating from the dataset. (overfitting)";
    return !likelyOverfitting ? response : (response.substring(0, 1995 - overfittingWarning.length) + overfittingWarning);
};

module.exports = {
    isOverfitting,
    appendOverfitting,
};
