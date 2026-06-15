const env = require("./env-util");

class ChatterboxConditionals {
    /** Users are intended to be able to use this freely. Use for conditionals generated from open voices like TTS models & such. @enum */
    static USAGE_FREE = 0;
    /** Users need approval to use this voice. Use if you want to make conditionals of your own voice but want others to play with it. @enum */
    static USAGE_APPROVAL = 1;
    /** Voice is only usable in personal mode. Use if you want to make conditionals of your own voice but dont want others to play with it. @enum */
    static USAGE_PERSONAL = 2;

    // NOTE: `conditionals` is a file path *prefix*, where the final path will be `${conditionals}${exaggeration}.pt`; these are generated with src/resources/python/chatterbox/precalc.py
    // NOTE: Add these to getVoiceNames or they wont appear in listings. DO NOT USE THE `name` property, use the property name (the thing after `static`)
    static Jeremy = {
        name: "Jeremy",
        conditionals: "C:/Users/Jeremy/Documents/GitHub/jeremy-stream-bot/conditionals/voice",
        usage: this.USAGE_APPROVAL,
    };

    // NOTE: Use the ChatterboxConditionals property name, NOT the voice.name!!
    static getVoiceNames() {
        return [
            "Jeremy",
        ];
    }

    static default = this.Jeremy;
}

module.exports = ChatterboxConditionals;