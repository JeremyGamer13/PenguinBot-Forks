const discord = require("discord.js");

const configuration = require("../../config");

class Command {
    constructor() {
        this.name = "echo";
        this.description = "you cant use it loser";
        this.attributes = {
            unlisted: true,
            permission: 3,
        };

        this.aliases = ["say"];
    }

    reject(message) {
        return message.reply("naw");
    }

    async invoke(message, args, util) {
        if (!configuration.permissions.echo.includes(message.author.id))
            return this.reject(message);

        // delete the root message first
        await message.delete();

        // check for reply
        const replyMsg = await util.getReply(message);
        const sendFunction = replyMsg
            ? (payload) => replyMsg.reply(payload)
            : (payload) => message.channel.send(payload);
        return sendFunction({
            content: args.join(' '),
            files: message.attachments.toJSON().map(file => new discord.MessageAttachment(file.url, file.name)),
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: false
            }
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
