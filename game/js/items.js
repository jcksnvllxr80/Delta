/* ===================================================
   items.js - Item pickups, bombs, and projectiles
   =================================================== */

const Items = {
    /** Active pickups on the current screen */
    pickups: [],

    /** Active bombs on screen */
    bombs: [],

    /** Active projectiles (enemy shots, etc.) */
    projectiles: [],

    /** Reset for new screen */
    reset() {
        this.pickups = [];
        this.bombs = [];
        this.projectiles = [];
    },

    /** Load pickups for current screen from world data */
    loadScreenItems() {
        const screenItems = World.getScreenItems();
        const prefix = World.inDungeon ? 'd' : 'o';
        const key = prefix + ':' + World.screenX + ',' + World.screenY;

        for (const item of screenItems) {
            // Check if chest was already opened
            if (World.openedChests[key]) {
                const already = World.openedChests[key].some(
                    p => p.r === item.tileY && p.c === item.tileX
                );
                if (already) continue;
            }
            // Chest items are collected by interacting with the chest tile
            // We store them as metadata, not as pickups
        }
    },

    /** Spawn a pickup at a pixel position */
    spawnPickup(x, y, type) {
        this.pickups.push({
            x, y, w: 10, h: 10,
            type, // 'heart', 'key', 'bomb_ammo', 'heart_container', 'bombs', 'boss_key'
            timer: 0,
            collected: false,
        });
    },

    /** Spawn a bomb at pixel position */
    spawnBomb(x, y) {
        this.bombs.push({
            x, y, w: 12, h: 12,
            timer: 90, // 1.5 seconds at 60fps
            exploded: false,
            explosionTimer: 0,
        });
    },

    /** Spawn a projectile */
    spawnProjectile(x, y, dx, dy, fromEnemy) {
        this.projectiles.push({
            x, y, w: 6, h: 6,
            dx, dy,
            fromEnemy: !!fromEnemy,
            active: true,
            timer: 120,
        });
    },

    /** Update all items */
    update() {
        // Update pickups (bobbing animation)
        for (const p of this.pickups) {
            p.timer++;
            // keys should never disappear; other pickups despawn after 10 sec
            if ((p.type !== 'key' && p.type !== 'boss_key') && p.timer > 600) {
                p.collected = true; // Despawn
            }
        }

        // Update bombs
        for (const b of this.bombs) {
            if (!b.exploded) {
                b.timer--;
                if (b.timer <= 0) {
                    b.exploded = true;
                    b.explosionTimer = 20;
                    this._bombExplode(b);
                }
            } else {
                b.explosionTimer--;
            }
        }

        // Update projectiles
        for (const p of this.projectiles) {
            p.x += p.dx;
            p.y += p.dy;
            p.timer--;

            // Collide with walls
            const tileX = Math.floor((p.x + p.w / 2) / TILE);
            const tileY = Math.floor((p.y + p.h / 2) / TILE);
            if (World.isSolid(tileX, tileY)) {
                p.active = false;
            }
            if (p.timer <= 0) p.active = false;
            if (p.x < -8 || p.x > GAME_W + 8 || p.y < -8 || p.y > GAME_H + 8) {
                p.active = false;
            }
        }

        // Clean up
        this.pickups = this.pickups.filter(p => !p.collected);
        this.bombs = this.bombs.filter(b => !b.exploded || b.explosionTimer > 0);
        this.projectiles = this.projectiles.filter(p => p.active);
    },

    /** Handle bomb explosion - destroy nearby cracked walls */
    _bombExplode(bomb) {
        const cx = bomb.x + bomb.w / 2;
        const cy = bomb.y + bomb.h / 2;
        const radius = 24; // explosion radius in pixels

        // Check tiles around the bomb
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const tx = col * TILE + TILE / 2;
                const ty = row * TILE + TILE / 2;
                const dist = Math.hypot(tx - cx, ty - cy);
                if (dist < radius) {
                    const tile = World.getTile(col, row);
                    if (tile === TL.CRACKED) {
                        World.destroyTile(col, row, World.inDungeon ? TL.FLOOR : TL.PATH);
                    }
                }
            }
        }
    },

    /** Check pickup collision with player */
    checkPlayerPickup(player) {
        const px = player.x + 3;
        const py = player.y + 4;
        const pw = 10;
        const ph = 12;

        for (const pickup of this.pickups) {
            if (pickup.collected) continue;
            if (this._rectsOverlap(px, py, pw, ph, pickup.x, pickup.y, pickup.w, pickup.h)) {
                pickup.collected = true;
                return pickup;
            }
        }
        return null;
    },

    /** Check projectile collision with a rect */
    checkProjectileHit(x, y, w, h, fromEnemy) {
        for (const p of this.projectiles) {
            if (!p.active) continue;
            if (p.fromEnemy !== fromEnemy) continue;
            if (this._rectsOverlap(x, y, w, h, p.x, p.y, p.w, p.h)) {
                p.active = false;
                return true;
            }
        }
        return false;
    },

    /** Check if a bomb explosion hits a rect */
    checkBombHit(x, y, w, h) {
        for (const b of this.bombs) {
            if (!b.exploded || b.explosionTimer < 15) continue; // only first few frames
            const bx = b.x - 8;
            const by = b.y - 8;
            const bw = b.w + 16;
            const bh = b.h + 16;
            if (this._rectsOverlap(x, y, w, h, bx, by, bw, bh)) {
                return true;
            }
        }
        return false;
    },

    _rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    },
};
