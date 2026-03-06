const NodeAPICommand = require("../../basecommands/nodeapicommand");

const jgNodeUtils = require("jg-node-utils");

function newCommand(presetFunc, preset) {
    return class extends NodeAPICommand {
        constructor() {
            super();
            this.preset = preset;
            this.presetFunc = presetFunc;

            this.name = preset.short;
            this.description = preset.description;
        }
    };
}

const commands = {};
for (const presetName in jgNodeUtils.overlayPresets) {
    const presetFunc = jgNodeUtils.overlayPresets[presetName];
    const preset = presetFunc();

    const command = newCommand(presetFunc, preset);
    commands[preset.short] = command;
}

module.exports = commands;