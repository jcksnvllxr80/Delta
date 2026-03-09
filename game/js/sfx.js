/* ===================================================
   sfx.js - Sound effects manager
   =================================================== */

// lightweight helper for short effects.  Loads files from `sfx/` folder.
const SFX = {
    context: null,
    buffers: {},

    init() {
        if (this.context) return;
        this.context = new (window.AudioContext || window.webkitAudioContext)();
    },

    async load(name) {
        if (!this.context) this.init();
        if (this.buffers[name]) return this.buffers[name];
        const url = `sfx/${name}.mp3`;
        try {
            const resp = await fetch(url);
            const arr = await resp.arrayBuffer();
            const buf = await this.context.decodeAudioData(arr);
            this.buffers[name] = buf;
            return buf;
        } catch (e) {
            console.warn('SFX load failed', name, e);
        }
    },

    async play(name) {
        if (!this.context) this.init();
        let buf = this.buffers[name];
        if (!buf) buf = await this.load(name);
        if (!buf) return;
        const src = this.context.createBufferSource();
        src.buffer = buf;
        src.connect(this.context.destination);
        src.start();
    }
};

window.SFX = SFX;