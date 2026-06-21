const delay = (ms) => {
    const startTime = Date.now();
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(Date.now() - startTime);
        }, ms);
    });
};

class ToolPause {
    /**
     * @returns {import("ollama-chatting").Tool}
     */
    static getRepresentation() {
        return {
            type: 'function',
            function: {
                name: 'pause',
                description: 'Pause the conversation for a set amount of seconds, intended for conversational timing when requested.',
                callback: this.execute.bind(this),
                parameters: {
                    type: 'object',
                    required: ['seconds'],
                    properties: {
                        seconds: { type: 'number', description: 'The number of seconds to wait.' },
                    },
                },
            },
        }
    }

    /**
     * @param {import("ollama").ToolCall} call 
     */
    static async execute(call) {
        const seconds = Math.max(0, Math.min(Number(call.function.arguments.seconds) || 0, 10));
        console.log("ToolPause: stalling for", seconds, "seconds");

        // do the wait
        const milliseconds = await delay(seconds * 1000);

        // wait has passed
        const spentTimeStr = (milliseconds / 1000).toFixed(2);
        return `*${spentTimeStr} seconds have now passed.*`;
    }
}

module.exports = ToolPause;
