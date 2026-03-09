/* ===================================================
   effects.js - Simple visual effects (enemy death pop)
   =================================================== */

const Effects = {
    list: [],

    reset() {
        this.list = [];
    },

    /** spawn a death pop at pixel coords */
    spawnDeath(x, y) {
        // store spawn coordinates; drawing will add HUD_H to match enemy positions
        this.list.push({ x, y, timer: 40 }); // longer duration
    },

    update() {
        for (const e of this.list) {
            e.timer--;
        }
        this.list = this.list.filter(e => e.timer > 0);
    },

    draw(ctx) {
        ctx.fillStyle = '#ff0';
        for (const e of this.list) {
            const t = e.timer;
            // size grows then shrinks
            const size = Math.ceil((40 - t) / 2) + 1;
            // apply HUD offset so effect lines up
            ctx.fillRect(e.x - size/2, e.y + HUD_H - size/2, size, size);
        }
    }
};

window.Effects = Effects;