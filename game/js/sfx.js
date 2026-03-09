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
        // try common extensions in order
        const exts = ['mp3','ogg','wav'];
        for (const ext of exts) {
            const url = `sfx/${name}.${ext}`;
            try {
                const resp = await fetch(url);
                if (!resp.ok) continue;
                const arr = await resp.arrayBuffer();
                const buf = await this.context.decodeAudioData(arr);
                this.buffers[name] = buf;
                return buf;
            } catch (e) {
                // try next extension
            }
        }
        console.warn('SFX load failed for', name);
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