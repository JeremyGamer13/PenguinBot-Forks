const jgNodeUtils = require("jg-node-utils");
const env = require("../util/env-util");

class NodeAPICommand {
    constructor() {
        this.name = "";
        this.description = "";
        this.attributes = {};

        this.cooldownUsers = {};

        this.preset = {};
        this.presetFunc = () => this.preset;
    }

    makeUrl(message, args) {
        const preset = this.presetFunc();
        return preset.endpoint + jgNodeUtils.objectToSearchParams(preset.content);
    }
    async invoke(message, args, util) {
        const canDo = util.request("nodeApiStuff");
        if (!canDo) return message.reply("disabled (this command is probably for discord screenshare)");
        if (this.cooldownUsers[message.author.id] > Date.now()) return message.reply("no too much");
        
        const url = `${env.get("JGNODEAPI_URL")}${this.makeUrl(message, args)}`;
        // TODO: make this configurable and clone it to the other bot
        this.cooldownUsers[message.author.id] = Date.now() + 15000;

        const result = await fetch(url);
        const resultJson = await result.json();
        if (!result.ok) throw new Error(resultJson.error);
    }
}

module.exports = NodeAPICommand;
