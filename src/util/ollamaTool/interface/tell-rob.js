const env = require("../../env-util");

class ToolMockRob {
    /**
     * @returns {import("ollama-chatting").Tool}
     */
    static getRepresentation() {
        return {
            type: 'function',
            function: {
                name: 'tell-rob',
                description: 'Tells Rob the Robot a literal English sentence or question.',
                parameters: {
                    type: 'object',
                    required: ['text'],
                    properties: {
                        text: { type: 'string', description: 'The sentence or question to ask Rob.' },
                    },
                },
            },
        }
    }

    /**
     * @param {import('discord.js').TextChannel} channel 
     * @param {import("ollama").ToolCall} call 
     */
    static async handle(channel, call) {
        const robId = env.get("ROB_INTEGRATION_USER_ID");
        const startTime = Date.now();
        await channel.send({
            content: `<@${robId}> ${call.function.arguments.text}`,
            allowedMentions: {
                users: [robId],
                roles: [],
                repliedUser: false
            }
        });
        try {
            const collected = await channel.awaitMessages({
                filter: m => m.author.id === robId,
                max: 1,
                time: 10000,
                errors: ['time']
            });
            const spentTimeStr = ((Date.now() - startTime) / 1000).toFixed(2);
            return `Rob thought for ${spentTimeStr} seconds, and said: "${collected.first().content}"`;
        } catch (err) {
            return "Rob is either not in the server or disabled.";
        }
    }
}

module.exports = ToolMockRob;
