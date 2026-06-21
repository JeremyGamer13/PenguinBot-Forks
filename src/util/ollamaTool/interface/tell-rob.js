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
     * @param {import('discord.js').Message} message 
     * @param {import("ollama").ToolCall} call 
     */
    static async handle(message, call) {
        const robId = `1344543448719429673`;
        const startTime = Date.now();
        await message.channel.send({
            content: `<@${robId}> ${call.function.arguments.text}`,
            allowedMentions: {
                users: [robId],
                roles: [],
                repliedUser: false
            }
        });
        try {
            const collected = await message.channel.awaitMessages({
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
