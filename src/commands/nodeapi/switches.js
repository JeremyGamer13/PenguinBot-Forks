const discord = require("discord.js");

const env = require("../../util/env-util");
const fetchNodeApi = require("../../util/fetch-nodeapi")

class Command {
    constructor() {
        this.name = "switches";
        this.description = "jgnodeapi switches";
        this.attributes = {
            permission: 4,
            unlisted: true,
        };
    }

    async invoke(message, args, util) {
        const endpoint = "/api/switches";
        const switchName = args[0];
        const switchValue = String(args[1]) === "true";
        if (switchName) {
            const response = await fetchNodeApi(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    switches: { [switchName]: switchValue }
                })
            });
            if (!response.ok) throw new Error(await response.text());
            message.reply({
                content: `${switchName} = ${switchValue}`,
                allowedMentions: { // ping NO ONE. this can DEFINETLY be abused if we did allow pings
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
            return;
        }

        const response = await fetchNodeApi(endpoint);
        const switches = await response.json();
        const formatted = Object.keys(switches).map(switchName => `${switchName} = ${switches[switchName]}`).join("\n");
        message.reply({
            content: formatted,
            allowedMentions: { // ping NO ONE. this can DEFINETLY be abused if we did allow pings
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        })
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;