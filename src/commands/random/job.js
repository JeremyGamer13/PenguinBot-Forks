class Command {
    constructor(client) {
        this.name = "job";
        this.description = "get a job spongebob";
        this.attributes = {
            permission: 0,
            unlisted: true,
        };

        this.alias = ["furryroleplay"];
    }

    invoke(message) {
        message.reply("<https://www.gov.uk/find-a-job>");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;