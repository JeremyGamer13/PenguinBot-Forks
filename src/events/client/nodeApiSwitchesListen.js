const env = require("../../util/env-util");
const configuration = require("../../config");

const fetchNodeApi = require("../../util/fetch-nodeapi");

class BotEvent {
    constructor(client) {
        this.listener = "ready";
        this.once = true;

        this.client = client;
        this.state = null;
        /** @type {import("discord.js").TextChannel} */
        this.channel = null;
    }

    async invoke(client, state) {
        if (!env.getBool("JGNODEAPI_SWITCHES_LISTEN")) return;
        const isInTestMode = state.isInTestMode;
        const isInPersonalMode = state.isInPersonalMode;

        const mainChannel = await client.channels.cache.get(configuration.channels.botTestingChannel);
        if (!mainChannel) throw new Error("No channel to log JGNODEAPI_SWITCHES_LISTEN in");

        console.log("JGNODEAPI_SWITCHES_LISTEN");

        this.state = state;
        this.channel = mainChannel;
        this.setupPolling();
    }

    lastIsCharging = false;
    lastIsLowBattery = false;
    lastIsCriticalBattery = false; // panic, assume shutdown will happen unexpectedly and close things down
    lastIsShuttingDownScheduled = false; // log that shutdown is occurring
    lastIsShuttingDownSoon = false; // close the mc server
    lastIsShuttingDownCritical = false; // JSB stop doing shit
    lastIsShuttingDownNow = false; // timer <= 0 (likely wont even get set before server closes)
    lastIsPrimaryNetwork = true;
    async evaluateJLaptopSwitches(switches) {
        // NOTE: MinecraftWatchdog also fetches switches from jg_node_api so itll handle shutdowns on its own timing
        // battery
        if (this.lastIsLowBattery !== switches.isLowBattery) {
            try {
                if (switches.isLowBattery) {
                    await this.channel.send(`# <@${env.get("OWNER")}> BATTERY IS LOWER THAN EXPECTED`
                        + "\n" + `The automatic charging setup might be disconnected or device is being stressed heavily`);
                } else {
                    await this.channel.send(`Recovered from isLowBattery; likely heavy device stress`);
                }
            } catch (err) {
                console.error(`ALERT FAILED: ${switches.isLowBattery ? "BATTERY IS LOWER THAN EXPECTED" : "Recovered from isLowBattery; likely heavy device stress"}`, err);
            }
            this.lastIsLowBattery = switches.isLowBattery;
        }
        if (this.lastIsCriticalBattery !== switches.isCriticalBattery) {
            if (switches.isCriticalBattery) {
                try {
                    await this.channel.send(`# <@${env.get("OWNER")}> BATTERY IS CRITICAL`
                        + "\n" + `- Battery critical so we are force shutting down`
                        + "\n" + `- Expecting MinecraftWatchdog to deny new server starts`
                        + "\n" + `- Expecting Minecraft server to shutdown semi-gracefully/improperly`);
                } catch (err) {
                    console.error(`ALERT FAILED: BATTERY IS CRITICAL`, err);
                }
                process.exit(1);
            }
            this.lastIsCriticalBattery = switches.isCriticalBattery;
        }

        // automatic scheduled shutdown
        if (this.lastIsShuttingDownScheduled !== switches.isShuttingDownScheduled) {
            if (switches.isShuttingDownScheduled) {
                try {
                    await this.channel.send(`# <@${env.get("OWNER")}> Automatic Shutdown is scheduled on device`
                        + "\n" + `- Expecting MinecraftWatchdog to deny new server starts`
                        + "\n" + `- Expecting Minecraft server to chat that server shutting down soon`);
                } catch (err) {
                    console.error(`ALERT FAILED: Automatic Shutdown is scheduled on device`, err);
                }
            }
            this.lastIsShuttingDownScheduled = switches.isShuttingDownScheduled;
        }
        if (this.lastIsShuttingDownSoon !== switches.isShuttingDownSoon) {
            if (switches.isShuttingDownSoon) {
                this.state.heavyExternalStuff = false;
                try {
                    await this.channel.send(`# <@${env.get("OWNER")}> Shutdown is happening very soon`
                        + "\n" + `- heavyExternalStuff = ${this.state.heavyExternalStuff}`
                        + "\n" + `- Expecting Minecraft server to shutdown gracefully`);
                } catch (err) {
                    console.error(`ALERT FAILED: Shutdown is happening very soon`, err);
                }
            }
            this.lastIsShuttingDownSoon = switches.isShuttingDownSoon;
        }
        if (this.lastIsShuttingDownCritical !== switches.isShuttingDownCritical) {
            if (switches.isShuttingDownCritical) {
                try {
                    await this.channel.send(`# <@${env.get("OWNER")}> Shutdown critical so we are force shutting down`);
                } catch (err) {
                    console.error(`ALERT FAILED: Shutdown critical so we are force shutting down`, err);
                }
                process.exit(1);
            }
            this.lastIsShuttingDownCritical = switches.isShuttingDownCritical;
        }

        // network
        if (this.lastIsPrimaryNetwork !== switches.isPrimaryNetwork) {
            // NOTE: We actually cant log to discord on lost primary network for obvious reasons
            // TODO: Maybe we should disable fetching to jg_node_api in this state (except /api/switches)? But that should still work fine on other networks since the URL is on localhost. It's not really clear what we should do in this case, maybe dont check at all.
            if (!switches.isPrimaryNetwork)
                console.warn("WARNING: Lost primary network? Stated by jg_node_api. Likely lost connection to discord gateway");
            this.lastIsPrimaryNetwork = switches.isPrimaryNetwork;
        }
    }

    async evaluateSwitches(switches) {
        if (env.getBool("JGNODEAPI_SWITCHES_LISTEN_JLAPTOP")) {
            await this.evaluateJLaptopSwitches(switches);
        }
    }
    setupPolling() {
        let pollingNodeApi = false;
        setInterval(async () => {
            if (pollingNodeApi) return;

            pollingNodeApi = true;
            try {
                const response = await fetchNodeApi("/api/switches");
                const switches = await response.json();
                await this.evaluateSwitches(switches);
            } catch (err) {
                console.warn("POLLING NODE API SWITCHES FAILED:", err);
            } finally {
                pollingNodeApi = false;
            }
        }, 5000);
    }
}

module.exports = BotEvent;