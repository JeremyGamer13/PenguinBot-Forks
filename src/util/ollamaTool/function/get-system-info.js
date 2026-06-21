const os = require("os-utils");

const env = require("../../env-util.js");
const configuration = require("../../../config.js");
const FormatTime = require('../../format-time.js');

class ToolSystemInfo {
    /**
     * @returns {import("ollama-chatting").Tool}
     */
    static getRepresentation() {
        return {
            type: 'function',
            function: {
                name: 'get-system-info',
                description: 'Get info about the parent system/server running the current AI model (the assistant), as well as info about the assistant itself.',
                callback: this.execute.bind(this),
            },
        }
    }

    /**
     * @param {import("ollama").ToolCall} call 
     */
    static execute(call) {
        const memoryMegabytes = os.totalmem();
        const memoryUsagePercentage = Math.round((os.freemem() / memoryMegabytes) * 100) + '%';
        const deviceUptime = FormatTime.formatTime(os.sysUptime() * 1000);
        const logicalProcessors = os.cpuCount();

        const enabledModels = Object.keys(configuration.funkyCapabilities.ollamaConfigs)
            .filter(modelName => configuration.funkyCapabilities.ollamaConfigs[modelName]);

        const deviceLabel = env.get("DEVICE_LABEL");
        const platformDetails = `${process.platform} ${process.arch} on Node ${process.version}`;
        return `The device is named "${deviceLabel}".`
            + "\n" + `The device has named the AI assistant under the name "${configuration.nameBotReference}".`
            + "\n" + `Running ${platformDetails}.`
            + "\n" + `The device has been online for ${deviceUptime}.`
            + "\n" + `The device has ${memoryMegabytes} MB of memory, ${memoryUsagePercentage} of which is in use.`
            + "\n" + `The device's CPU has ${logicalProcessors} logical processors.`
            + "\n" + `The device currently has these AI models available: ${enabledModels.join(", ")}`
            + "\n" + `The device ${configuration.funkyCapabilities.ollamaImageProcessingViable ? "is capable of AI image processing" : "cannot process images with AI"}.`;
    }
}

module.exports = ToolSystemInfo;
