const env = require("./util/env-util");

// Seperated from .env since these are mostly cosmetic changes or big lists.
const configuration = {
    // Used in cases like "Welcome to the {NAME} server!" and "Do not post NSFW invites in the {NAME} server."
    nameReference: "Server",
    // The name of your bot (some files like the credits command will still say PenguinBot, since this is PenguinBot's code)
    nameBotReference: "gronk",

    // Status of the bot, stated in Discord like "Playing (text)" or "Playing a game" then, on a new line "(text)"
    status: {
        // The bot can use seperate text when running in test mode.
        // Note that the .env variables are available here if you use stuff like {{NAME}}, avoid using something like {{TOKEN}} or {{PENGUINMOD_PASSWORD}}
        normal: "the latest AI grifter scamming technology",
        testing: "the latest AI grifter scamming technology",
    },

    // The bot has many auto responses, toggled using the RESPOND_TO_KEYWORDS env. They will only be usable in these channels:
    autoResponseChannels: [
        // These are the channels used in PenguinMod's server:
        // dont include things like bug reports or suggestions
        '1038238583686967428', // penguin-chat
        '1038236110335266907', // off-topic
        '1038251459843723274', // commands
        '1139749855913316474', // penguinbot-test
        "1551460701044867172", // dedicated penguinbot test server
        '746156168560508953', // general in test thing
    ],

    // Used to link to channels within the server. These IDs are the ones we use in PenguinMod.
    channels: {
        // A channel for PenguinBot testing and occasional logging.
        botTestingChannel: "746156168560508953",

        // A channel dedicated to bot commands.
        commands: "1038251459843723274",

        // A channel dedicated to bot commands for developers.
        commandsDev: "1174359501688803358",

        help: "746156168560508953",
        spaces: "746156168560508953",
        spam: "1040077506029551647",
    },
    
    // Servers used for different environments (production, testing)
    servers: {
        production: [
            env.get("SERVER_ID"),
        ],
        testing: [
            "1551457087274618990", // penguinbot testing
            "746156168560508950", // older penguinbot testing
        ],
    },

    permissions: {
        // Permission Level 1: A low permission level that isnt used much.
        permission1: [
        ],
        // Permission Level 2: Reserved for moderator commands.
        permission2: [
        ],
        // Permission Level 3: Mostly developer commands.
        permission3: [
        ],

        // User IDs that can always use donator commands:
        exclusiveUsers: [env.get("OWNER"), "462098932571308033"],

        // Role IDs considered "exclusive", so Server booster & Donator
        exclusiveRoles: [
        ],

        // Role IDs considered event managers (for PenguinMod)
        eventManagerRoles: [
        ],

        // Channels checked for in the lockedToCommands property (excluding commands channel from above & threads within that channel)
        lockedToCommands: [
            // These are the channels allowed in PenguinMod's server:
            "1038251459843723274", // commands
            "1174359501688803358", // dev-commands
            "1485480777658400819", // staff-commands
            '1139749855913316474', // penguinbot-test
            "1203112896645832714", // penguinbot-logs
            '1143305846227476511', // dev-github-logs
            '1038251742439149661', // dev-chat
            "1161202733269930075", // vip-chat
            '1176024649390366780', // admin-chat
            '1146290116583751681', // web-mod-chat
            '1038252107846930513', // server-mod-chat
            '1176024748300443698', // admin-furry-rp
            '1126699478607470652', // mod-furry-rp
            "1492317730232336465", // larp-as-a-bot
            "1463077406146301963", // dev-dump
            "1551460701044867172", // dedicated penguinbot test server: penguinbot
            "1563121434903977996", // dedicated penguinbot test server: penguinbot-testing
            '746156168560508953', // general in test thing
        ],

        // On top of the permission check, who can use pm!pull (pull & restart can cause running custom code)
        pull: [env.get("OWNER")],
    },
};

module.exports = configuration;
