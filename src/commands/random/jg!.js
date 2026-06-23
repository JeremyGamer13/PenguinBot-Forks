class Command {
    constructor(client) {
        this.name = "jg!";
        this.description = "stop that boy";
        this.attributes = {
            permission: 0,
            unlisted: true,
        };

        this.triggers = 0;
    }

    invoke(message) {
        this.triggers += 1;
        if (this.triggers !== 5) return;
        message.reply("can you Shut the fuck up 😇");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;