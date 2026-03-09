/* ===================================================
   music.js - Simple background music using Web Audio API
   =================================================== */

// This very basic music generator creates a looping tone/melody
// when the game starts.  Replace the `createSong` implementation
// if you want to load a real audio file instead.

const Music = {
    context: null,
    source: null,

    /** initialize AudioContext and build buffer */
    init() {
        if (this.context) return;
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        // build a small melody buffer
        const sampleRate = this.context.sampleRate;
        const duration = 4; // seconds
        const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        // simple sequence of frequencies (notes) 
        const notes = [220, 246, 261, 293, 329, 349, 392, 440];
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.floor((t / duration) * notes.length) % notes.length;
            const freq = notes[noteIndex];
            data[i] = Math.sin(2 * Math.PI * freq * t) * 0.1;
        }
        this.buffer = buffer;
    },

    /** start playback (looping) */
    play() {
        if (!this.context) this.init();
        if (this.source) return; // already playing
        this.source = this.context.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.loop = true;
        this.source.connect(this.context.destination);
        this.source.start();
    },

    /** stop playback */
    stop() {
        if (this.source) {
            this.source.stop();
            this.source.disconnect();
            this.source = null;
        }
    }
};

// make available globally
window.Music = Music;
