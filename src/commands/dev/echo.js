const configuration = require("../../config");

class Command {
    constructor() {
        this.name = "echo";
        this.description = "you cant use it loser";
        this.attributes = {
            unlisted: true,
            permission: 3,
        };
        this.aliases = ["say"]
    }

    reject(message) {
        message.reply({
            content: 'You need a permission level of 6 or 7 to run this command, yours is currently 0.'
        });
    }

    extractMessageFromReply(message) {
        if (!(message.reference && message.reference.messageId)) {
            throw new Error('Message is not a reply');
        }
        const reply = message.reference.messageId;
        return message.channel.messages.fetch(reply);
    }
    async invoke(message, args) {
        if (!configuration.permissions.echo.includes(message.author.id)) {
            this.reject(message);
            return;
        }

        const messageOpts = {
            content: args.join(' '),
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: false
            }
        };

        message.delete();
        if (message.reference && message.reference.messageId) {
            const replyMsg = await this.extractMessageFromReply(message);
            replyMsg.reply(messageOpts);
            return;
        }
        message.channel.send(messageOpts);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
