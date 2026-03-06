const OptionType = require('../util/optiontype');

class Command {
    constructor() {
        this.name = "base";
        this.description = "Description";
        this.attributes = {
            unlisted: true,
            permission: 4
        };
    }

    invoke(message) {
        
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
