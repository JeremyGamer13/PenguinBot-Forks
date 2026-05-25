# Jeremy Stream Bot
this is literally just a fork of PenguinBot-Public but i deleted a bunch of stuff & added some small things

# Related Repos
[jg_node_api_public](https://github.com/JeremyGamer13/jg_node_api_public)
[jg_node_utils](https://github.com/JeremyGamer13/jg_node_utils)

# PenguinBot-Public
A stripped-down public version of PenguinBot.
Certain features or commands may be missing from this repository.

If you want to restructure the codebase in any way and submit it as a PR, please note we may be very strict about it since we will have to make all of our future contributions under the format of your changes. Ideally, don't mess with how commands are defined but it's cool if you move around folders, modules, classes, or functions & such to reduce clutter.

# Notes
Discord is a much more casual & non-serious place for people to chat in our view.
If you see swear words or immature jokes in the source of PenguinBot, this is why. Sorry about that, don't put this code on your resume. :P

This bot was originally built to be a Private Bot for PenguinMod's Discord Server. There has been changes made to make the bot mostly universal, but if you have any issues relating to server, role, member, or channel specific features not working, this is likely why.

You can edit most of these Discord-specific features in the `src/config.js` file. More complicated checks may be present in the `src/util/utility.js` file or `src/events/client` folder.
Most other things will just be command-specific checks or custom emojis being used.

The bot uses many assets that are not under the MIT license. They are unlicensed.

For the most part, you need a good understanding of JavaScript and JSON to make commands or do anything meaningful with the code of this bot.

# License
The code found in this repository is licensed under the MIT license.
Please let us know if this is incorrect or invalid.

The `assets` folder is **NOT** under this license. Content in there may be licensed under, literally anything.

# Setup
**Please CLONE this repository properly with Git, do not download it as a ZIP.**
If you do not do this, many commands relating to managing the GitHub repository will cause undefined behavior.

1. Install Node.js, preferably v18 or v20. **Newer versions of Node may not be compatible out of the box with Canvas or other modules yet.**
2. Install FFMPEG. Easiest way to check if it's setup properly is to run `ffmpeg` in a terminal with no arguments.
3. Install Git
4. Create a `cache`, `databases`, `temp`, folder in the root folder for PenguinBot.
5. ~~Download the `assets` folder in the link found in the Notes section, and put it in the root folder for PenguinBot.~~ I dont know what to do for this here, good luck
6. Install all of the node modules with `npm ci` or `npm i`
    - If you have `nvm` installed to switch between Node installations, you may need to rebuild canvas when switching versions by using `npm rebuild canvas`
7. Duplicate `.env.template` and rename it to `.env`, then fill any of the information you can.
    - Certain keys are used only when the bot is ran with `npm run test`, notably the `TOKEN_TEST`.
8. Run the bot with `npm run test` for development and `npm start` or `node permrun.js` for production.
    - If you want to run the bot once in development, use `node src/index.js test`. This is not recommended for production as the bot can be restarted via commands.
    - use `node permrun.js personal` for personal mode
    - When the bot is online, you can use the `restart` command in Discord to restart the bot.

Check the Notes section for details on customizing PenguinBot to your liking.

## Additional setup
- **You will need multiple versions of python installed for some external libraries.** Expect countless issues and bugs with python installation and setup if you do so.
    - This document does not cover python installation bugs or quirks for my sanity.
    - In my experience, certain `pytorch` installations may cause extreme stress on the network and device. Things may work fine after installation.
- Setup [jg_node_api](https://github.com/JeremyGamer13/jg_node_api_public) and link it in .env
    - This enables A LOT OF FEATURES like all of the stream overlays
- To add more overlays
    - Make sure to clone [jg_node_utils](https://github.com/JeremyGamer13/jg_node_utils)
    - then find `link-jg-node-utils.js` in Jeremy Stream Bot, configure it to point to your jg_node_utils,
    - then run it with Node
    - then find `link-jg-node-utils.js` in jg_node_api, configure it to point to your jg_node_utils,
    - then run it with Node
    - Modify jg_node_utils to create your overlays & add assets in jg_node_api for the overlays to actually use
- VLC Media Player Integration
    - Modify .env to enable behavior
    - Open VLC's "All" settings > Main interfaces > Lua > Lua HTTP, and add a Password. VLC will start listening on port 8080.
        - Lua Telnet settings do NOT do anything for this, that is a different protocol
        - If you do NOT want to use port 8080, then whenever you run VLC, you need to run it like so: `"C:\Program Files\VideoLAN\VLC\vlc.exe" --extraintf http --http-port [PORT]` with `[PORT]` being any port to run VLC on
            - you may want to just edit any shortcuts to have that command directly
- [Stammer](https://github.com/Firepal/stammer) tool (used in commands) (requires python)
    - Configured via `.env`. Follow the instructions on their repo to download
- [Ollama](https://ollama.com/) integration
    - Ollama uses machine learning technology and may be too demanding on your system. Don't enable it if you don't want to.
    - Configured via `.env`, `src/config.js`, and `src/util/ollama-clients.js`
    - Cloud models will not be supported. Only local models are guaranteed to work
- [Demucs](https://github.com/adefossez/demucs) library (used in commands) (requires python for installation)
    - Demucs uses machine learning technology and may be too demanding on your system. Don't enable it if you don't want to.
    - Configured via `.env`. I do not use `Anaconda` myself (the repo "recommends it") so i can't say if it works with Jeremy Stream Bot's setup
    - Follow instructions on their repo for installation
    - The `facebookresearch` repo is no longer maintained, use https://github.com/adefossez/demucs
- RVC AI dubs (used in commands) (requires python)
    - RVC uses machine learning technology and may be too demanding on your system. Don't enable it if you don't want to.
        - On integrated GPUs/CPU you will have varied performance and speeds, I would recommend not setting this up on those devices
    - RVC allows for controversial AI dubbing. Don't enable it if you don't want to.
    - You will need to provide your own `.pth` and `.index` voices for voice inference.
        - Making your own voices will (eventually) be covered here: https://github.com/JeremyGamer13/resources-jeremy-rvc-setup
        - You can find existing **(but likely unethically trained)** voices online at places like: https://voice-models.com/
    - RVC Configured via `.env` and `src/util/rvc-models.js`.
        - For integrated GPUs/CPU you should change `rvc.py` to `rvc_cpu.py`. The `rvc.py` script is meant for NVIDIA GPUs using device cuda:0.
            - the `rvc_cpu.py` script was designed for the intel 11th gen i3-1115G4 3.00 GHZ CPU
        - On integrated GPUs/CPU you will have varied performance and speeds, I would recommend not setting this up on those devices
    - Convoluted setup:
        - Install Python 3.10 specifically (other verisons dont seem to work well)
            - You may want to set it up so you can use `py -3.10` if you already have another version installed
        - install rvc-python with `py -3.10 -m pip install rvc-python`
            - On NVIDIA GPUs you will want to use the CUDA versions of `torch` and other dependencies of `rvc-python`
            - I am unsure of the configuration for AMD/Intel ARC GPUs as I do not have one. You may want to modify/duplicate `rvc.py` or `rvc_cpu.py` to support these devices
            - On integrated GPUs/CPU you will have varied performance and speeds, I would recommend not setting this up on those devices
            - Expect a ton of weird torch installation bugs and problems, especially when mixed with Demucs; things can get really messy and I dont have a solution to put here

# Basic Commands Template
```js
const OptionType = require('../util/optiontype');

class Command {
    constructor() {
        this.name = "base";
        this.description = "Description";
        this.attributes = {
            unlisted: true,
            permission: 3
        };
    }

    invoke(message) {

    }
}

module.exports = Command;
```

# Signoffs
Have a good life! Don't ever think you can't do something, you always can when you're programming something.

- MubiLop | 08/02/2024
