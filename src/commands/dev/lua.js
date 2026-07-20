const nodeUtil = require('node:util');

const Lua = require("../../util/lua.js");

class Command {
    constructor() {
        this.name = 'lua';
        this.description = 'Run sandboxed Lua code in Discord.';
        this.attributes = {
            unlisted: true,
            permission: 3,
            permissionInclusive: [
                "1264445751723823245",
                "694587798598058004",
            ],
        };
    }

    async invoke(message, args) {
        let luaCode = args.join(" ");
        const luaAttachment = message.attachments.first();
        if (luaAttachment) {
            const attachmentFetch = await fetch(luaAttachment.url);
            const attachmentString = await attachmentFetch.text();
            luaCode = attachmentString;
        }

        try {
            const result = await Lua.evaluate(luaCode);
            const display = typeof result === "object" && result ? `ansi\n${nodeUtil.inspect(result, { showHidden: true, colors: true }).slice(0, 1989)}` : result;
            message.reply({
                content: `\`\`\`${display}\`\`\``.substring(0, 2000),
                allowedMentions: { // ping NO ONE. this can DEFINETLY be abused if we did allow pings
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        } catch (err) {
            message.reply({
                content: `❌ - Error running Lua code\n\`\`\`${err.stack ? err.stack : err}\`\`\``.substring(0, 2000),
                allowedMentions: { // ping NO ONE. this can DEFINETLY be abused if we did allow pings
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        }
    }
}

module.exports = Command;
