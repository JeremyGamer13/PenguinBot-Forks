const Database = require('sync-json-database');
const VLCTrackerDatabase = new Database('./databases/vlc-tracker.json', { indented: true });

class VLCTracker {
    /**
     * @typedef {object} VLCTrackedSong
     * @property {string} name Formatted name of the song. Due to the nature of local file playlists, this can change at any time.
     * @property {number} playTime Total seconds played
     * @property {number} duration Seconds length of the song
     * @property {number} appearances How many times the song has appeared (ie, how many times it played at some point, even if the song wasn't played all the way through)
     */
    /** @private @returns {VLCTrackedSong} */
    static _makeSong(name) {
        return {
            name: name,
            playTime: 0,
            duration: 0,
            appearances: 0,
        };
    }
    /** @private @returns {VLCTrackedSong} WILL BE MUTABLE (you can edit props on it & save the DB) */
    static _findOrMake(name) {
        const songs = this.getSongs();
        const song = songs.find(song => song.name === name);
        if (song)
            return song;
        
        // make a new song and return it
        const newSong = this._makeSong(name);
        songs.push(newSong);

        VLCTrackerDatabase.setLocal("songs", songs);
        return newSong;
    }

    /**
     * Gets all registered songs.
     * @returns {VLCTrackedSong[]}
     */
    static getSongs() {
        return VLCTrackerDatabase.get("songs") || [];
    }
    /**
     * Gets a song's database record, if it exists.
     * @param {string} name
     * @returns {VLCTrackedSong | null}
     */
    static getSong(name) {
        return this.getSongs().find(song => song.name === name) ?? null;
    }
    /**
     * Set a song's info, like duration or appearance count.
     * Only specified props are updated.
     * @param {string} name
     * @param {{ playTime:number?, duration:number?, appearances:number? }} newInfo
     */
    static setSong(name, newInfo = {}) {
        if (!name)
            throw new Error("Invalid song name");

        const song = this._findOrMake(name);
        if (Object.hasOwn(newInfo, "playTime"))
            song.playTime = newInfo.playTime;
        if (Object.hasOwn(newInfo, "duration"))
            song.duration = newInfo.duration;
        if (Object.hasOwn(newInfo, "appearances"))
            song.appearances = newInfo.appearances;
        VLCTrackerDatabase.set("songs", this.getSongs());
    }

    /**
     * Adds playback time to a song, creating its record if necessary.
     * @param {string} name
     * @param {number} seconds
     * @returns {VLCTrackedSong}
     */
    static addPlayTime(name, seconds) {
        if (!name)
            throw new Error("Invalid song name");
        if (!Number.isFinite(seconds) || seconds <= 0)
            throw new Error("seconds must be a positive number");

        const song = this._findOrMake(name);
        song.playTime += seconds;

        VLCTrackerDatabase.set("songs", this.getSongs());
        return song;
    }

    // TODO: Reuse the event Xp leaderboard display code to instead make like a leaderboard of songs by playTime
    /**
     * @private returns sorted entries
     */
    static async _getSortedEntries() {
        // DISCLOSURE: ai was used for this
        const entries = EventXPDatabase
            .array()
            .map(({ key, value }) => ({
                userId: key,
                username: value.username,
                xp: value.xp ?? 0,
                level: this.xpToLevel(value.xp ?? 0)
            }))
            .sort((a, b) => {
                // Higher XP first.
                // User ID provides deterministic ordering for ties.
                if (b.xp !== a.xp)
                    return b.xp - a.xp;
                return a.userId.localeCompare(b.userId);
            })
            .map((entry, i) => ({
                // return rank here for use in displaying user's rank elsewhere
                rank: i + 1,
                ...entry,
            }));
        return entries;
    }
    /**
     * Get a paginated XP leaderboard.
     * @param {number} page
     * @param {number} pageSize Number of users per page (default: 10)
     * @returns {Promise<{
     *   page:number,
     *   pageSize:number,
     *   totalUsers:number,
     *   totalPages:number,
     *   entries:Array<{
     *     rank:number,
     *     userId:string,
     *     username:string,
     *     xp:number,
     *     level:number
     *   }>
     * }>}
     */
    static async getLeaderboard(page = 0, pageSize = 10) {
        // DISCLOSURE: ai was used for this
        if (!Number.isInteger(page) || page < 0)
            throw new Error('page must be a non-negative integer');
        if (!Number.isInteger(pageSize) || pageSize < 1)
            throw new Error('pageSize must be a positive integer');

        const entries = (await this._getSortedEntries())
            .filter(entry => entry.xp > 0);
        const totalUsers = entries.length;
        const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
        const start = page * pageSize;
        const pagedEntries = entries
            .slice(start, start + pageSize);

        return {
            page,
            pageSize,
            totalUsers,
            totalPages,
            entries: pagedEntries
        };
    }
}

module.exports = VLCTracker;
