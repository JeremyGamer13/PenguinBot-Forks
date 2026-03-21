class Command {
    constructor() {
        this.name = "definethesoundofsilence";
        this.description = "It’s a philosophical question framed in a remarkably simplistic and dismissive way.";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    invoke() {
        
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;