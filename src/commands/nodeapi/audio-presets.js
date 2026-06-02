const NodeAPIPreset = require("../../basecommands/nodeapipreset");

const jgNodeUtils = require("jg-node-utils");

function newCommand(presetFunc, preset) {
    return class extends NodeAPIPreset {
        constructor() {
            super();
            this.preset = preset;
            this.presetFunc = presetFunc;

            this.toggle = "nodeApiAudios";

            this.name = preset.short;
            this.description = preset.description;

            switch (preset.name) {
                case "hopon":
                    this.makeUrl = this.makeHoponUrl;
                    break;
            }
        }
        makeHoponUrl(message) {
            const username = message.author.username;
            const preset = this.presetFunc(username);
            return preset.endpoint + jgNodeUtils.objectToSearchParams(preset.content);
        }
    };
}

const commands = {};
for (const presetName in jgNodeUtils.audioPresets) {
    const presetFunc = jgNodeUtils.audioPresets[presetName];
    const preset = presetFunc();

    const command = newCommand(presetFunc, preset);
    commands[preset.short] = command;
}

module.exports = commands;