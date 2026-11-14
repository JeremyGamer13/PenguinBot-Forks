class ToolMockReact {
    /**
     * @returns {import("ollama-chatting").Tool}
     */
    static getRepresentation() {
        return {
            type: 'function',
            function: {
                name: 'react',
                description: 'React to the current user\'s message with an emoji. This attaches the specified emoji to their message.',
                parameters: {
                    type: 'object',
                    required: ['emoji'],
                    properties: {
                        emoji: { type: 'string', description: 'The emoji to react with.' },
                    },
                },
            },
        }
    }

    /**
     * @param {import("ollama").ToolCall} call 
     * @param {import('discord.js').Message} message 
     */
    static async handle(call, message) {
        try {
            await message.react(call.function.arguments.emoji);
            return `Reacted with the specified emoji.`;
        } catch (err) {
            return `Error: ${err}`;
        }
    }
}

module.exports = ToolMockReact;
