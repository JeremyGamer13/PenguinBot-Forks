const VLCMediaPlayer = require('../../vlc-media-player.js');
const VLCPoller = require('../../vlc-poller.js');

class ToolVLCListening {
    /**
     * @returns {import("ollama-chatting").Tool}
     */
    static getRepresentation() {
        return {
            type: 'function',
            function: {
                name: 'get-host-listening',
                description: 'Get the raw name of the audio file the host of the parent system/server is listening to.',
                callback: this.execute.bind(this),
            },
        }
    }

    /**
     * @param {import("ollama").ToolCall} call 
     */
    static execute(call) {
        const currentSong = VLCPoller.currentSong;
        if (!currentSong) return "Host is not listening to anything.";
        return `Host is listening to audio with raw name "${VLCMediaPlayer.cleanUpName(currentSong)}"`;
    }
}

module.exports = ToolVLCListening;
