const fs = require("fs");
const path = require("path");

const env = require("./env-util");

class TTS {
    /**
     * speak TTS and make an Buffer
     * @param {string} text 
     * @param {"google"|"espeak-ng"|"balabolka"} model 
     * @param {string} language 
     * @param {string?} name 
     * @returns {Buffer}
     */
    static async speak(text, model = "google", language = "en", name) {
        // TODO: Implement JGNODEAPI_TOKEN once added to jg_node_api
        const url = `${env.get("JGNODEAPI_URL")}/api/tts?text=${encodeURIComponent(text)}&model=${encodeURIComponent(model)}&lang=${encodeURIComponent(language)}${name ? `&name=${encodeURIComponent(name)}` : ""}`;
        
        const result = await fetch(url);
        if (!result.ok) {
            const resultJson = await result.json();
            throw new Error(resultJson.error);
        }

        const arrayBuffer = await result.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return buffer;
    }
}

module.exports = TTS;