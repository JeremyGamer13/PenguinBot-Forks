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
        testing: "my {{DEVICE_LABEL}} is ON",
        personal: "my {{DEVICE_LABEL}} is ON",
    },

    // The bot has many auto responses, toggled using the RESPOND_TO_KEYWORDS env. They will only be usable in these channels:
    autoResponseChannels: [
        // These are the channels used in PenguinMod's server:
        // dont include things like bug reports or suggestions
        '1139749855913316474', // penguinbot-test
        "1551460701044867172", // dedicated penguinbot test server
        '746156168560508953', // test thing
    ],

    // jg: Funky stuff the bot might not be able to handle
    funkyCapabilities: {
        availableOllamaModels: [
            "custom-penguinmod-server-v1",
            "custom-penguinmod-server-v2",
            "custom-penguinmod-server-v3",
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
            "gpt-oss:20b",
            "gemma4-cpu:e4b",
            "gemma4-cpu:e2b",
            "gemma3-cpu:4b",
            "gemma3-cpu:1b",
            "gemma3-cpu:270m",
        ],

        // jg: which ollama configs are available
        ollamaConfigs: {
            genericIO: true,
            processorIO: true,
            messageRewriter: true,
            lightText: true,
            robChatter: true,
            searchOverview: true,
            svgCoder: true,
            svgCoderImage: true,
            mutatableChatbot: true,
        },

        // jg: can ollama use images on this device? (in some cases, even if a model can run with vision capability,
        // image requests might take forever to process and arent worth doing)
        ollamaImageProcessingViable: true,
    },

    // Used to link to channels within the server. These IDs are the ones we use in PenguinMod.
    channels: {
        // A channel for PenguinBot testing and occasional logging.
        botTestingChannel: "746156168560508953",

        // A channel dedicated to bot commands.
        commands: "746156168560508953",

        // A channel dedicated to bot commands for developers.
        commandsDev: "1174359501688803358",

        // The channel where blocked automod alerts are sent. PenguinBot will send automod bypass alerts here too, if the basic-automod file is added.
        // See src/util/utility.js to see where basic-automod is used.
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
        spam: "1567458592020373535",

        // jg: funky channels
        // jg: The brainrot pun channel
        funkyBrainrot: "1488684785776726078",

        // jg: The british chat
        funkyBritishChat: "1488692670665855027",

        // jg: the No talking channel
        funkyNoTalking: "1488734908242329622",

        // jg: santa list!!!!
        funkySantaList: "1444881035719606373",

        // jg: where rob should talk in
        funkyRobChat: "1511217728361467947",
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
        exclusiveUsers: [env.get("OWNER"), "462098932571308033", "567307285324496897"],

        // Role IDs considered "exclusive", so Server booster & Donator
        exclusiveRoles: [
            "1150383694842953778", // Donator
            "1102050296265445436", // Server booster
        ],

        // jg: User IDs that can use AI cover commands with approval (instant approval in personal mode)
        ethicalCoverUsers: [
            env.get("OWNER"),
            "462098932571308033", // jeremygamer13
            '694587798598058004', // ddededodediamante
            '860531746294726736', // godslayerakp
            '790782926785609728', // ianyourgod
            '567307285324496897', // jwklong
            '1264445751723823245', // gen1x
            '1445330994742951988', // dotun
            '1376566271558160504', // vedal
            '983532566822916106', // lunair
            '1470133853200060477', // ddededodediamanto
            '1121567701303824574', // picreator
            '402803671689068544', // catto4
        ],

        // jg: Role IDs that can use AI cover commands with approval (instant approval in personal mode)
        ethicalCoverRoles: [
            // Super fucking evil Muwahahaha
            "1150383694842953778", // Donator
            "1102050296265445436", // Server booster
        ],

        // jg: User IDs allowed to talk directly to AI models without problem
        trustedAiChatUsers: [
            env.get("OWNER"),
            "462098932571308033", // jeremygamer13
            '694587798598058004', // ddededodediamante
            '860531746294726736', // godslayerakp
            '790782926785609728', // ianyourgod
            '567307285324496897', // jwklong
            '715193626430406770', // anonygoose
            '1274550888706474169', // ash unbravechimp
            '1446263635268735151', // not__bob
            '1264445751723823245', // gen1x
            '1445330994742951988', // dotun
        ],

        // Role IDs considered event managers (for PenguinMod)
        eventManagerRoles: [
            "1361088428556419383", // Event Manager
            "1559282557227376861", // Event Manager (testing)
            "1033551639170273380", // Admin Permissions (PenguinMod)
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
            '746156168560508953', // epic test channel
            '1481769759371563277', // epit test
        ],

        // On top of the permission check, who can use pm!eval (run custom code)
        eval: [env.get("OWNER")],

        // On top of the permission check, who can use pm!pull (pull & restart can cause running custom code)
        pull: [env.get("OWNER")],

        // On top of the permission check, who can use pm!echo
        echo: [env.get("OWNER"), "462098932571308033", "567307285324496897"],

        // On top of the permission check, who can use pm!delmsg
        delmsg: [env.get("OWNER"), "462098932571308033", "567307285324496897"],

        // On top of the permission check, who can use pm!penguinbotupload
        penguinbotupload: [env.get("OWNER"), "462098932571308033", "567307285324496897"],

        // Who can use "force" options in pm!exclusiverole
        exclusiveroleForce: [env.get("OWNER"), "462098932571308033", "567307285324496897"],
    },
};

module.exports = configuration;
