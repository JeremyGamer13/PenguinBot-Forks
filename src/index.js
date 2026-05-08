const nodeprocess = require('process');
const discord = require("discord.js");

const CommandUtility = require("./util/utility.js");
const BaseEventHandler = require('./handleEvents.js');
const env = require("./util/env-util.js");

const isInTestMode = process.argv[2] === 'test';
const isInPersonalMode = process.argv[2] === 'personal';
if (isInTestMode) {
    console.log('Launched in test mode');
} else if (isInPersonalMode) {
    console.log('Launched in personal mode');
} else {
    console.log('Launched in public mode');
}

// create client with stuff
const client = new discord.Client({
    intents: [
        Object.values(discord.Intents.FLAGS).reduce((acc, p) => acc | p, 0)
    ],
    partials: [
        "REACTION",
        "CHANNEL"
    ]
});

// stop it from fuckin crashing after som stupid discord error
nodeprocess.on('uncaughtException', (err) => {
    console.log('\n');
    console.log('---------------------');
    console.log('Error!');
    console.log(err);
    console.log('---------------------');
    console.log('\n');
});

// add state stuff
const prefix = isInTestMode ? env.get("PREFIX_TEST")
    : (isInPersonalMode ? env.get("PREFIX_PERSONAL") : env.get("PREFIX"));
const state = {
    commands: {},
    services: {}, // commands can add to this object themselves
    slash: {},
    prefix,
    isInTestMode,
    isInPersonalMode,
    panelForcedDisabled: true,
    preventRuntimeChanges: env.getBool('PREVENT_UPDATES'),

    // JG: Random thihngs
    nodeApiStuff: false,
    heavyExternalStuff: true,
    santaListProcessing: false,
    santaListLastAddedTo: 0,
};
CommandUtility.state = state;
CommandUtility.client = client;

// login
const token = isInTestMode ? env.get("TOKEN_TEST")
    : (isInPersonalMode ? env.get("TOKEN_PERSONAL") : env.get("TOKEN"));
client.login(token).catch((e) => {
    console.error('Login Error;', e);
    throw e; // we really only console.error to say where the error was
});

BaseEventHandler.handleEvents(client, state, isInTestMode);
