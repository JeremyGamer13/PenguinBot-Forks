class ToolTest {
    /**
     * @returns {import("ollama-chatting").Tool}
     */
    static getRepresentation() {
        return {
            type: 'function',
            function: {
                name: 'test',
                description: 'Test tool. Use it if instructed to by the user.',
                callback: this.execute.bind(this),
            },
        }
    }

    /**
     * @param {import("ollama").ToolCall} call 
     */
    static execute(call) {
        return `The information you just gave to me was: ${JSON.stringify(call.function)}`;
    }
}

module.exports = ToolTest;
