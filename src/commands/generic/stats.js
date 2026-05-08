const discord = require("discord.js");

const os = require("os-utils");
const env = require('../../util/env-util');

const fetchCpuUsage = () => {
    return new Promise((resolve) => {
        const waitStarted = (new Date()).getTime();
        os.cpuUsage((usage) => {
            const responseTime = ((new Date()).getTime()) - waitStarted;
            resolve({
                cpuUsage: usage,
                waitTime: responseTime
            });
        });
    });
};

class Command {
    constructor(client) {
        this.name = "stats";
        this.description = "Get internal server details about the bot.";
        this.attributes = {
            unlisted: false,
            admin: false,
            lockedToCommands: true,
        };

        this.client = client;
    }

    async invoke(message, _, util) {
        message.channel.sendTyping();
        const deviceLabel = env.get("DEVICE_LABEL");
        const { cpuUsage, waitTime:cpuFetchTime } = await fetchCpuUsage();
        
        const embed = new discord.MessageEmbed();
        embed.setColor("#ff8800");
        embed.setTitle('Statistics');

        embed.addFields({
            name: 'Server Host Details',
            value: `\`\`${process.platform} ${process.arch} on Node ${process.version}\`\``,
            inline: false
        }, {
            name: 'CPU Fetch Time',
            value: `${cpuFetchTime}ms`,
            inline: true
        }, {
            name: 'JG details',
            value: `${deviceLabel}: (`
                + `${util.request("isInPersonalMode") ? "personal" : "public"}`
                + `, ` + `${util.request("isInTestMode") ? "testing" : "production"}`
                + ")",
            inline: false
        });

        const memUsage = Math.round((os.freemem() / os.totalmem()) * 100) + '%';
        const readableCpuUsage = Math.round(cpuUsage * 100) + '%';
        embed.setFooter({
            text: `Memory: ${memUsage} | CPU: ${readableCpuUsage}`
        });

        message.reply({
            embeds: [embed]
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;