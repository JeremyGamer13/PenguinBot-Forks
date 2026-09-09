const env = require("./env-util");

class FluidSynthSoundFonts {
    // NOTE: `path` is the path to the soundfont file. `config` is an optional FluidSynth config file. `path` can be an `.sf2`, `.sf3`, `.dls`
    // NOTE: Add these to getSoundFontNames or they wont appear in listings. DO NOT USE THE `name` property, use the property name (the thing after `static`)
    static GeneralMIDI = {
        name: "General MIDI",
        path: "C:/Users/Jeremy/Documents/GitHub/jeremy-stream-bot/assets/midi/gm.dls",
        config: null,
    };

    // NOTE: Use the FluidSynthSoundFonts property name, NOT the soundFont.name!!
    static getSoundFontNames() {
        return [
            "GeneralMIDI",
        ];
    }

    static default = this.GeneralMIDI;
}

module.exports = FluidSynthSoundFonts;