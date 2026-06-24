const Database = require('sync-json-database');
const PoopDatabase = new Database('./databases/poop-database.json');

const tryCatch = require('../../util/try-catch.js');
const getSpecialMessage = tryCatch(() => require('../../resources/poop-messages.js')) || (() => null);

class Command {
    constructor() {
        this.name = "poop";
        this.description = "hahahaja <:glee:1505817436895707288>";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    /** @param {number} counter */
    getMessage(counter) {
        const specialMessage = getSpecialMessage(counter);
        return specialMessage || `haahnhaha ${counter} <:glee:1505817436895707288>`;
    }

    invoke(message) {
        // update
        PoopDatabase.updateLocal("counter", (num) => {
            return Math.max(0, Number(num || 0)) + 1;
        });
        PoopDatabase.updateLocal("users", (list) => {
            const newList = list || [];
            newList.push(message.author.id);
            return newList;
        });
        PoopDatabase.saveDataToFile();

        const counter = PoopDatabase.get("counter");
        message.reply({
            content: this.getMessage(counter),
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