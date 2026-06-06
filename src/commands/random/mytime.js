const timeMountainTime = () => {
    const now = new Date();
    const options = {
        timeZone: 'America/Denver',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };

    return new Intl.DateTimeFormat('en-US', options).format(now);
};

class Command {
    constructor() {
        this.name = "mytime";
        this.description = "see jeremy gamer 13 time";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    invoke(message) {
        const currentTime = timeMountainTime();
        message.reply({
            content: `it is currently **${currentTime}** in JeremyGamer13's time`,
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