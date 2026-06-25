class Command {
    constructor() {
        this.name = "restartr";
        this.description = "Literally not useful at all";
        this.attributes = {
            unlisted: true,
            permission: 4,
        };
        this.alias = ["restat", "restar", "resart", "restrt"];
    }

    reject(message) {
        message.reply({
            content: 'You need a permission level of 529999999999999890890890890890890890389432497325823528392943 to run this command, yours is currently 0.'
        });
    }

    invoke(message) {
        message.reply(`haha spelt it wrong idiot`);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;