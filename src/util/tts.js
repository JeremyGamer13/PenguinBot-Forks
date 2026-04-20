const fs = require("fs");
const path = require("path");

const env = require("./env-util");

class TTS {
    static async speak(text, language = "en") {
        const url = `${env.get("JGNODEAPI_URL")}/api/tts?text=${encodeURIComponent(text)}&lang=${language}`;
        
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