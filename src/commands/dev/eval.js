const nodeUtil = require('node:util');

const configuration = require("../../config.js");

const env = require("../../util/env-util.js");
const tryCatch = require('../../util/try-catch');
const OptionType = require("../../util/optiontype.js");
const BaseCommand = require("../../classes/base-command.js");
const evalEnvironment = tryCatch(() => require("../../util/eval-environment")) || eval;

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "eval";
        this.description = "admin";
        this.attributes = {
            unlisted: true,
            permission: 3,
        };
    }

    reject(message) {
        return message.reply({
            files: ['./assets/randomImages/pleasespeed.png']
        });
    }

    async invoke(message, args, util) {
        if (env.getBool("DISABLE_ARBITRARY_OS_LEVEL_CODE"))
            return message.reply("Variable `DISABLE_ARBITRARY_OS_LEVEL_CODE` is set to true on this host.");
        if (!configuration.permissions.eval.includes(message.author.id))
            return this.reject(message);

        const javascript = args.join(' ');
        console.log('\n');
        console.log(`${message.author.username}: ${message.author.id};`);
        console.log(javascript);
        console.log('\n');

        try {
            const evalFunc = evalEnvironment.bind(this);
            const result = await evalFunc(javascript, { message, args, util, javascript });
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
                content: `❌ - epic fucking fail loser\n\`\`\`${err.stack ? err.stack : err}\`\`\``.substring(0, 2000),
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

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
