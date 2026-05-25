class Command {
    constructor() {
        this.name = "where";
        this.description = "Shows where items are in an image.";
        this.attributes = {
            unlisted: true,
            permission: 0,
        };

        this.alias = ["whereis"];
    }

    invoke() {
        // TODO: malke this
        throw new Error("Not implemented");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;