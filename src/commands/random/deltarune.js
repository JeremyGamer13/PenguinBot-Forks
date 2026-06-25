const FormatTime = require("../../util/format-time.js");

const activeTimestamp = 1819999990000;

class Command {
    constructor() {
        this.name = "deltarune";
        this.description = "The Night before Deltarune Tomorrow";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    invoke(message) {
        const currentTime = Date.now();
        const difference = activeTimestamp - currentTime;
        message.reply({
            content: difference <= 0 ? `wha? whatre you doing-its ITS RIGHT NOW DELTARUNE NOW <:glee:1505817436895707288><:glee:1505817436895707288><:glee:1505817436895707288>`
                : `Deltarune chapter 67 is in ${FormatTime.formatTime(difference)} (specifically, its happening on <t:${activeTimestamp / 1000}:s> <t:${activeTimestamp / 1000}:R>)`,
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: true
            }
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;