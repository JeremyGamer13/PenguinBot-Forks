const jgNodeUtils = require("jg-node-utils");

const env = require("../../util/env-util");
const configuration = require("../../config");

const NodeAPIPreset = require("../../basecommands/nodeapipreset.js");

// preset classes
class NodeAPIPresetAudio extends NodeAPIPreset {
    constructor(presetFunc, preset) {
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

    // url overrides
    /** @param {discord.Message} message */
    makeHoponUrl(message) {
        const username = message.author.username;
        const preset = this.presetFunc(username);
        return preset.endpoint + jgNodeUtils.objectToSearchParams(preset.content);
    }
}
class NodeAPIPresetOverlay extends NodeAPIPreset {
    constructor(presetFunc, preset) {
        super();
        this.preset = preset;
        this.presetFunc = presetFunc;

        this.toggle = "nodeApiOverlays";

        this.name = preset.short;
        this.description = preset.description;
    }
}

// event
class BotEvent {
    constructor(client) {
        this.listener = "ready";
        this.once = true;

        this.client = client;
    }

    async invoke(client, state) {
        const isInTestMode = state.isInTestMode;
        const isInPersonalMode = state.isInPersonalMode;

        // log we are odoing this
        console.log("effectPresetsReady");

        // handle presets
        let errors = '';
        let failed = false;
        // audio presets
        for (const presetName in jgNodeUtils.audioPresets) {
            try {
                const presetFunc = jgNodeUtils.audioPresets[presetName];
                const preset = presetFunc();

                const command = new NodeAPIPresetAudio(presetFunc, preset);
                if (state.nodeApiPresets[command.name])
                    throw new Error(`Node api audio preset name ${command.name} has been taken by existing Node api preset`);
                state.nodeApiPresets[command.name] = command;
            } catch (err) {
                console.error('Failed to load', presetName, '\n', err.message);
                errors += `\`\`${presetName}\`\` - ${err.message}\n`;
                failed = true;
            }
        }
        // overlay presets
        for (const presetName in jgNodeUtils.overlayPresets) {
            try {
                const presetFunc = jgNodeUtils.overlayPresets[presetName];
                const preset = presetFunc();

                const command = new NodeAPIPresetOverlay(presetFunc, preset);
                if (state.nodeApiPresets[command.name])
                    throw new Error(`Node api overlay preset name ${command.name} has been taken by existing Node api preset`);
                state.nodeApiPresets[command.name] = command;
            } catch (err) {
                console.error('Failed to load', presetName, '\n', err.message);
                errors += `\`\`${presetName}\`\` - ${err.message}\n`;
                failed = true;
            }
        }
        
        // log when presets cant load
        const mainChannel = await client.channels.cache.get(configuration.channels.botTestingChannel);
        if (failed) {
            mainChannel.send(`Some presets failed to load.\n\n${errors}`.substring(0, 2000));
        }
    }
}

module.exports = BotEvent;