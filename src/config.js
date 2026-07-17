const env = require("./util/env-util");

// Seperated from .env since these are mostly cosmetic changes or big lists.
const configuration = {
    // Used in cases like "Welcome to the {NAME} server!" and "Do not post NSFW invites in the {NAME} server."
    nameReference: "PenguinMod",
    // The name of your bot (some files like the credits command will still say PenguinBot, since this is PenguinBot's code)
    nameBotReference: "PenguinAI",

    // Status of the bot, stated in Discord like "Playing (text)" or "Playing a game" then, on a new line "(text)"
    status: {
        // The bot can use seperate text when running in test mode.
        // Note that the .env variables are available here if you use stuff like {{NAME}}, avoid using something like {{TOKEN}} or {{PENGUINMOD_PASSWORD}}
        normal: "💧 no water wasted",
        testing: "{{PREFIX_TEST}}help | PenguinAI Testing",
    },

    // The bot has many auto responses, toggled using the RESPOND_TO_KEYWORDS env. They will only be usable in these channels:
    autoResponseChannels: [
        // These are the channels used in PenguinMod's server:
        // dont include things like bug reports or suggestions
        '1038251459843723274', // commands
        '1139749855913316474', // penguinbot-test
        '1481769780418711562', // penguin-bot (test server)
        '1527141148777254982', // penguin-ai (test server)
    ],

    // Used to link to channels within the server. These IDs are the ones we use in PenguinMod.
    channels: {
        // A channel for PenguinBot testing and occasional logging.
        botTestingChannel: "1139749855913316474",

        // A channel dedicated to bot commands.
        commands: "1038251459843723274",

        // A channel dedicated to bot commands for developers.
        commandsDev: "1174359501688803358",

        // The channel where blocked automod alerts are sent. PenguinBot will send automod bypass alerts here too, if the basic-automod file is added.
        // See src/util/utility.js to see where basic-automod is used.
        automod: "1139749855913316474",

        // A channel where PenguinBot can send reported users to. Usable via /report
        userReports: "1139749855913316474",

        // A channel where PenguinBot can send reported mods to. Usable via /modreport
        adminReports: "1139749855913316474",

        help: "1139749855913316474",
        spaces: "1139749855913316474",
        teamWanted: "1139749855913316474",
        spam: "1040077506029551647",

        // PM AI: the train AI channel
        trainAi: "1490146686776119497",
    },

    permissions: {
        // Permission Level 1: A low permission level that isnt used much.
        permission1: [
        ],
        // Permission Level 2: Reserved for moderator commands.
        permission2: [
            "1161720252913168474", // Discord Mods
            "1173376969900052492", // Secondary Mods
        ],
        // Permission Level 3: Mostly developer commands.
        permission3: [
            "1038234739708006481", // Developer
            "1081053191602450552", // Retired Developer
        ],

        // User IDs that can always use donator commands:
        exclusiveUsers: [env.get("OWNER"), "462098932571308033", "567307285324496897"],

        // Role IDs considered "exclusive", so Server booster & Donator
        exclusiveRoles: [
            "1150383694842953778", // Donator
            "1102050296265445436", // Server Booster
        ],

        // Channels checked for in the lockedToCommands property (excluding commands channel from above & threads within that channel)
        lockedToCommands: [
            // These are the channels allowed in PenguinMod's server:
            '1143305846227476511', // dev-github-logs
            '1038251742439149661', // dev-chat
            '1139749855913316474', // penguinbot-test
            '1146290116583751681', // web-mod-chat
            '1038252107846930513', // server-mod-chat
            '1176024649390366780', // admin-chat
            '1176024748300443698', // admin-furry-rp
            '1126699478607470652', // mod-furry-rp
            '1481769780418711562', // penguin-bot (test server)
            '1527141148777254982', // penguin-ai (test server)
        ],

        // Channels checked for in the lockedToPenguinAI property (excluding channels that have been whitelisted for usage on runtime)
        lockedToPenguinAI: [
            '1038251459843723274', // commands
            '1174359501688803358', // commandsDev
            '1139749855913316474', // penguinbot-test
            '1481769780418711562', // penguin-bot (test server)
            '1527141148777254982', // penguin-ai (test server)
        ],

        // On top of the permission check, who can use pm!eval (run custom code)
        eval: [env.get("OWNER")],

        // On top of the permission check, who can use pm!echo
        echo: [env.get("OWNER"), "462098932571308033", "567307285324496897"],

        // On top of the permission check, who can use pm!toggle (enable/disable ai)
        toggle: [env.get("OWNER")],
    },

    // PM AI: Our unique settings
    penguinAi: {
        // TODO: Add this,. See if we can:
        // use a Markov chain method to run the AI much cheaper on CPU when the main model is unavailable
        markovModel: false,

        // TODO: Add this, see above also
        // Use the markov model when the AI takes longer than 10 seconds to respond (warming up)
        markovModelOnWarmUp: false,

        // TODO: Add this
        // If true, messages are preprocessed by a formal model to see if PenguinAI should have tool results in the conversation
        // This is because PenguinAI might have access to tools but the model might be too off-track by the training data to genuinely use them properly
        preprocessRequestForTools: false,

        // PM AI: can ollama use images on this device? (in some cases, even if a model can run with vision capability,
        // image requests might take forever to process and arent worth doing)
        ollamaImageProcessingViable: true,

        // PM AI: whether or not train AI channel does anything
        trainAIEnabled: true,
    },
};

module.exports = configuration;
