const jgNodeUtils = require("jg-node-utils");

const env = require("../util/env-util");
const fetchNodeApi = require("../util/fetch-nodeapi");

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

    makeUrl(message, args) {
        const preset = this.presetFunc();
        return preset.endpoint + jgNodeUtils.objectToSearchParams(preset.content);
    }
    async invoke(message, args, util) {
        const canDo = util.request(this.toggle);
        if (!canDo) return message.reply(`disabled (this command is probably for discord screenshare)`);
        if (this.cooldownUsers[message.author.id] > Date.now()) return message.reply("no too much");

        const endpoint = `${this.makeUrl(message, args)}`;
        this.cooldownUsers[message.author.id] = Date.now() + util.request("nodeApiPresetCooldown");

        const result = await fetchNodeApi(endpoint);
        const resultJson = await result.json();
        if (!result.ok) throw new Error(resultJson.error);
    }
}

module.exports = NodeAPIPreset;
