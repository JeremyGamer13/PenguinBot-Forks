const crypto = require('crypto');

function generatePointlessRandomSeries(length = 100) {
    const series = [];

    for (let i = 0; i < length; i++) {
        // Use crypto.randomBytes for more robust randomness.
        const buffer = crypto.randomBytes(4); // 4 bytes = 32 bits
        let randomNumber = buffer.readUInt32BE(0); // Convert to a big integer

        // Add some seemingly arbitrary manipulation to increase complexity
        randomNumber += Math.floor(Math.random() * 1000); // Add a small random offset
        randomNumber *= 7; // Multiply by a prime number
        randomNumber -= Math.floor(Math.random() * 200); // Subtract another random offset

        series.push(randomNumber);
    }

    return series;
}

class Command {
    constructor() {
        this.name = "blorp";
        this.description = "This command attempts to generate a surprisingly complex and utterly pointless series of random numbers. It’s guaranteed to waste your time.";
        this.attributes = {
            unlisted: false,
            lockedToCommands: true,
            permission: 0,
        };
    }

    invoke(message) {
        message.reply({
            content: JSON.stringify(generatePointlessRandomSeries(50)).substring(0, 200),
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