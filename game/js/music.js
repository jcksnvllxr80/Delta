/* ===================================================
   music.js - Simple background music using Web Audio API
   =================================================== */

// This very basic music generator creates a looping tone/melody
// when the game starts.  Replace the `createSong` implementation
// if you want to load a real audio file instead.

const Music = {
    context: null,
    source: null,
    buffers: {},
    current: null,

    /** load audio file for track name (returns Promise-buffer) */
    async _loadTrack(name) {
        // map logical names to file paths in music/ folder
        const map = {
            title: 'music/intro.mp3',
            overworld: 'music/overworld.mp3',
            dungeon: 'music/dungeon.mp3',
        };
        const url = map[name] || map.overworld;
        const resp = await fetch(url);
        const arr = await resp.arrayBuffer();
        return await this.context.decodeAudioData(arr);
    },

    /** initialize AudioContext */
    init() {
        if (this.context) return;
        this.context = new (window.AudioContext || window.webkitAudioContext)();
    },

    /** ensure a buffer exists for a track */
    /** ensure a buffer exists for a track; caches promise so load only once */
    async _ensure(name) {
        if (!this.buffers[name]) {
            // immediately store promise to avoid duplicate fetches
            this.buffers[name] = this._loadTrack(name);
        }
        return await this.buffers[name];
    },

    /** play a named track, switching if necessary */
    async play(name='overworld') {
        if (!this.context) this.init();
        // resume if suspended (autoplay policy)
        if (this.context.state === 'suspended') {
            try { await this.context.resume(); } catch(e) {}
        }
        // if already requested this track (playing or loading), do nothing
        if (this.current === name) return;

        // stop any existing source (will clear current via stop())
        if (this.source) this.stop();
        // mark as current immediately to block further calls
        this.current = name;

        const buf = await this._ensure(name);
        // if track changed while loading, stop here
        if (this.current !== name) return;

        this.source = this.context.createBufferSource();
        this.source.buffer = buf;
        this.source.loop = true;
        this.source.connect(this.context.destination);
        this.source.start();
    },

    stop() {
        if (this.source) {
            this.source.stop();
            this.source.disconnect();
            this.source = null;
            this.current = null;
        }
    }
};

window.Music = Music;
