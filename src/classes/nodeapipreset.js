const jgNodeUtils = require("jg-node-utils");

const env = require("../util/env-util.js");
const BotState = require("../util/bot-state.js");
const OptionType = require('../util/optiontype.js');
const fetchNodeApi = require("../util/fetch-nodeapi.js");

const BaseCommand = require("./base-command.js");

class NodeAPIPreset extends BaseCommand {
    constructor() {
        super();
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
        const canDo = BotState.request(this.toggle);
        if (!canDo) return;
        if (this.cooldownUsers[message.author.id] > Date.now()) return message.reply("no too much");

        const endpoint = `${this.makeUrl(message)}`;
        this.cooldownUsers[message.author.id] = Date.now() + BotState.request("nodeApiPresetCooldown");

        const result = await fetchNodeApi(endpoint);
        const resultJson = await result.json();
        if (!result.ok) throw new Error(resultJson.error);
    }
}

module.exports = NodeAPIPreset;
