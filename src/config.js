const env = require("./util/env-util");

// Seperated from .env since these are mostly cosmetic changes or big lists.
const configuration = {
    // Used in cases like "Welcome to the {NAME} server!" and "Do not post NSFW invites in the {NAME} server."
    nameReference: "PenguinMod",
    // The name of your bot (some files like the credits command will still say PenguinBot, since this is PenguinBot's code)
    nameBotReference: "Jeremy Stream Bot",

    // Status of the bot, stated in Discord like "Playing (text)" or "Playing a game" then, on a new line "(text)"
    status: {
        // The bot can use seperate text when running in test mode.
        // Note that the .env variables are available here if you use stuff like {{NAME}}, avoid using something like {{TOKEN}} or {{PENGUINMOD_PASSWORD}}
        normal: "a game probably",
        testing: "a game probably",
        personal: "my {{DEVICE_LABEL}} is ON",
    },

    // The bot has many auto responses, toggled using the RESPOND_TO_KEYWORDS env. They will only be usable in these channels:
    autoResponseChannels: [
        // These are the channels used in PenguinMod's server:
        // dont include things like bug reports or suggestions
        '1139749855913316474', // penguinbot-test
        '746156168560508953', // test thing
    ],

    // jg: Funky stuff the bot might not be able to handle
    funkyCapabilities: {
        availableOllamaModels: [
            "custom-penguinmod-server-v1",
            "gemma4:e4b",
            "gemma4:e2b",
            "gemma3:12b",
            "gemma3:4b",
            "gemma3:1b",
            "gemma3:270m",
            "qwen3-vl:8b",
            "qwen3-vl:4b",
            "qwen3-vl:2b",
            "qwen3:8b",
            "qwen3:4b",
            "deepseek-r1:8b",
        ],

        // jg: which ollama clients are available
        ollamaClients: {
            genericIO: true,
            processorIO: true,
            messageRewriter: true,
            lightText: true,
            penguinGPT: true,
            tuffScript: true,
            mutatableChatbot: true,
        },

        // jg: can ollama use images on this device? (in some cases, even if a model can run with vision capability,
        // image requests might take forever to process and arent worth doing)
        ollamaImageProcessingViable: true,

        // jg: whether or not train AI channel does anything
        funkyTrainAIEnabled: true,
    },

    // Used to link to channels within the server. These IDs are the ones we use in PenguinMod.
    channels: {
        // A channel for PenguinBot testing and occasional logging.
        botTestingChannel: "746156168560508953",

        // A channel dedicated to bot commands.
        commands: "746156168560508953",

        // A channel dedicated to bot commands for developers.
        commandsDev: "1174359501688803358",

        // The channel where blocked automod alerts are sent. PenguinBot will send automod bypass alerts here too, if the basic_automod file is added.
        // See src/util/utility.js to see where basic_automod is used.
        automod: "746156168560508953",

        // A channel where PenguinBot can send reported users to. Usable via /report
        userReports: "746156168560508953",

        // A channel where PenguinBot can send reported mods to. Usable via /modreport
        adminReports: "746156168560508953",

        // jg: A channel where AI approval requests go to
        aiRequests: "1488362939130974258",

        help: "746156168560508953",
        spaces: "746156168560508953",
        teamWanted: "746156168560508953",
        spam: "",

        // jg: funky channels
        // jg: The brainrot pun channel
        funkyBrainrot: "1488684785776726078",

        // jg: The british chat
        funkyBritishChat: "1488692670665855027",

        // jg: the train AI channel
        funkyTrainAI: "1490146686776119497",

        // jg: the No talking channel
        funkyNoTalking: "1488734908242329622",

        // jg: santa list!!!!
        funkySantaList: "1444881035719606373",
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

        // jg: User IDs that can use AI cover commands with approval (instant approval in personal mode)
        ethicalCoverUsers: [
            env.get("OWNER"),
            "462098932571308033", // jeremygamer13
            '694587798598058004', // ddededodediamante
            '567307285324496897', // jwklong
            '1264445751723823245', // gen1x
            '1445330994742951988', // dotun
            '1376566271558160504', // vedal
        ],

        // jg: User IDs allowed to talk directly to AI models without problem
        trustedAiChatUsers: [
            env.get("OWNER"),
            "462098932571308033", // jeremygamer13
            '860531746294726736',
            '790782926785609728',
            '567307285324496897',
            '694587798598058004',
            '715193626430406770'
        ],

        // Channels checked for in the lockedToCommands property (excluding commands channel from above & threads within that channel)
        lockedToCommands: [
            // These are the channels allowed in PenguinMod's server:
            '1038251459843723274', // commands pm
            '1443403986357981274', // tuff vc
            '746156168560508953', // epic test channel
            '1481769759371563277', // epit test
            '1139749855913316474', // penguinbot-test
            '1124133055012020296', // tuff vc
            '1038236270079516682', // tuff vc
            '1169802355861114901', // tuff vc
            '1463077406146301963', // dev dump
            '1174359501688803358', // dev commands
            '1485480777658400819', // staff commands
        ],

        // On top of the permission check, who can use pm!eval (run custom code)
        eval: [env.get("OWNER"), "462098932571308033"],

        // On top of the permission check, who can use pm!echo
        echo: [env.get("OWNER"), "462098932571308033"],

        // On top of the permission check, who can use pm!delmsg
        delmsg: [env.get("OWNER"), "462098932571308033"],

        // On top of the permission check, who can use pm!penguinbotupload
        penguinbotupload: [env.get("OWNER"), "462098932571308033"],

        // Who can use "force" options in pm!exclusiverole
        exclusiveroleForce: [env.get("OWNER"), "462098932571308033"],
    },
};

module.exports = configuration;