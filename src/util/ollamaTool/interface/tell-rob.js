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
     * @param {import("ollama").ToolCall} call 
     * @param {import('discord.js').TextChannel} channel 
     * @param {number} [amountCalled=0] The amount of times this tool has been called already
     * @param {number} [amountMax=Infinity] The max amount of times that this tool shouldve been called
     */
    static async handle(call, channel, amountCalled = 0, amountMax = Infinity) {
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
                max: 5, // NOTE: Rob can respond in chunks like "yeah i think that", "thats um", "pretty cool"
                time: 45 * 1000, // 45 seconds
                errors: ['time']
            });
            const spentTimeStr = ((Date.now() - startTime) / 1000).toFixed(2);
            let robContent = `Rob thought for ${spentTimeStr} seconds, and said:`
                + " " + `"${collected.map(message => `${message.cleanContent || message.content}`.substring(0, 512)).join("\n")}"`;

            // NOTE: jsb should still try to naturally wrap up the convo on the outside
            // DISCLOSURE: the tool responses are generated wiith ayei, hoping to make the model a bit more understanding of what the error messages meant
            if (amountCalled === amountMax) {
                robContent += `\n\nSYSTEM NOTICE: This was your final permitted Rob interaction. Do not call the Rob tool again. End the conversation naturally now.`;
            } else if (amountCalled === amountMax - 1) {
                robContent += `\n\nSYSTEM NOTICE: You have 1 Rob interaction remaining after this one. Wrap up the conversation now.`;
            } else if (amountCalled === amountMax - 2) {
                robContent += `\n\nSYSTEM NOTICE: You will run out of Rob interactions in 2 calls after this one. Begin wrapping up the conversation now.`;
            }
            return robContent;
        } catch (err) {
            return "Rob is offline, disabled, or temporarily unavailable. He did not respond to your message.";
        }
    }
}

module.exports = ToolMockRob;
