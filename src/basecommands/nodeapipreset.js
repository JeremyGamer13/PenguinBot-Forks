const jgNodeUtils = require("jg-node-utils");

const env = require("../util/env-util");
const fetchNodeApi = require("../util/fetch-nodeapi");
const CommandUtility = require("../util/utility.js");

class NodeAPIPreset {
    constructor() {
        this.name = "";
        this.description = "";
        this.attributes = {};

        this.toggle = "nodeApiOverlays";
        this.cooldownUsers = {};

        this.preset = {};
        this.presetFunc = () => this.preset;
    }

    makeUrl(message) {
        const preset = this.presetFunc();
        return preset.endpoint + jgNodeUtils.objectToSearchParams(preset.content);
    }
    async invoke(message) {
        const canDo = CommandUtility.request(this.toggle);
        if (!canDo) return;
        if (this.cooldownUsers[message.author.id] > Date.now()) return message.reply("no too much");

        const endpoint = `${this.makeUrl(message)}`;
        this.cooldownUsers[message.author.id] = Date.now() + CommandUtility.request("nodeApiPresetCooldown");

        const result = await fetchNodeApi(endpoint);
        const resultJson = await result.json();
        if (!result.ok) throw new Error(resultJson.error);
    }
}

module.exports = NodeAPIPreset;
