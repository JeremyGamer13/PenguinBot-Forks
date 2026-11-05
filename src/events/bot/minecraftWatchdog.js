const configuration = require("../../config.js");

const env = require("../../util/env-util.js");

const BaseBotEvent = require("../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "ready";
        this.once = true;

        /** @type {import("discord.js").TextChannel} */
        this.channel = null;
    }

    async invoke() {
        if (!env.getBool("MINECRAFT_WATCHDOG_ENABLED")) return;

        const mainChannel = await this.client.channels.fetch(configuration.channels.botTestingChannel);
        if (!mainChannel) throw new Error("No channel to log minecraft watchdog statusChanged in");

        console.log("MINECRAFT_WATCHDOG_ENABLED");

        this.channel = mainChannel;        
        this.setupPolling();
    }
    async statusChanged(serverOnline) {
        if (serverOnline) {
            this.state.heavyExternalStuff = false;
            await this.channel.send(`MC Server is online; set heavyExternalStuff to ${this.state.heavyExternalStuff}`);
        } else {
            this.state.heavyExternalStuff = env.getBool("STATE_DEFAULT_HEAVYEXTERNALSTUFF");
            await this.channel.send(`MC Server is offline; resetting heavyExternalStuff to default (${this.state.heavyExternalStuff})`);
        }
    }

    serverStatus = false;
    setupPolling() {
        let pollingMinecraftServer = false;
        setInterval(async () => {
            if (pollingMinecraftServer) return;

            pollingMinecraftServer = true;
            try {
                const response = await fetch(`http://localhost:${env.getNumber("MINECRAFT_WATCHDOG_PORT")}`);
                const json = await response.json();
                if (!json.success || !json.minecraft) return;
                if (json.role !== "watchdog") return;
                
                const serverOnline = json.minecraft.server;
                if (this.serverStatus !== serverOnline) {
                    await this.statusChanged(serverOnline);
                    this.serverStatus = serverOnline;
                }
            } catch {
                // watchdog mightve closed for whatever reason
            } finally {
                pollingMinecraftServer = false;
            }
        }, 5000);
    }
}

module.exports = BotEvent;