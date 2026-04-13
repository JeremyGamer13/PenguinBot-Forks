class Command {
    constructor() {
        this.name = "randomthing";
        this.description = "It will randomly select a random, utterly pointless thing.";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
    }

    invoke(message) {
        const items = [
            "Flicker",
            "Rust",
            "Echo",
            "Silence",
            "Quill",
            "Glow",
            "Squish",
            "Thread",
            "Honeycomb",
            "Mumble",
            "Knot",
            "Bloom",
            "Pebble",
            "Shade",
            "Ripple",
            "Warp",
            "Bloom",
            "Static",
            "Grey",
            "Grain",
            "Spin",
            "Fade",
            "Echo",
            "Dust",
            "Sketch",
            "Wisp",
            "Moment",
            "Smooth",
            "Loom",
            "Wave",
            "Void",
            "Bloom",
            "Drift",
            "Pixel",
            "Sketch",
            "Loom",
            "Flow",
            "Shade",
            "Whisper",
            "Static",
            "Stillness",
            "Echo",
            "Bloom",
            "Void",
            "Dust",
            "Loom",
            "Flow",
            "Static",
            "Whisper",
            "Shade",
        ];
        const randomThing = items[Math.floor(Math.random() * items.length)];
        message.reply(randomThing);
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;