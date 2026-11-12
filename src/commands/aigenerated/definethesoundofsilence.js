const BaseCommand = require("../../classes/base-command.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "definethesoundofsilence";
        this.description = "It’s a philosophical question framed in a remarkably simplistic and dismissive way.";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    invoke(message, args, util) {
        
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;