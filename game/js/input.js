/* ===================================================
   input.js - Keyboard input handling
   =================================================== */

const Input = {
    _keys: {},
    _prev: {},

    init() {
        window.addEventListener('keydown', (e) => {
            this._keys[e.code] = true;
            // Prevent scrolling from arrow keys / space
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
        window.addEventListener('keyup', (e) => {
            this._keys[e.code] = false;
        });
    },

    /** Call once per frame AFTER processing input */
    update() {
        this._prev = { ...this._keys };
    },

    /** True while key is held */
    isDown(code) {
        return !!this._keys[code];
    },

    /** True only on the frame the key is first pressed */
    isPressed(code) {
        return !!this._keys[code] && !this._prev[code];
    },
};
