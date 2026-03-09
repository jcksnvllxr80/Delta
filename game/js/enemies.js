/* ===================================================
   enemies.js - Enemy types, AI, spawning
   =================================================== */

const Enemies = {
    /** Active enemies on current screen */
    list: [],

    /** Reset for new screen */
    reset() {
        this.list = [];
    },

    /** Spawn enemies for current screen */
    spawnForScreen() {
        this.reset();
        const spawns = World.getEnemySpawns();
        for (const s of spawns) {
            this.list.push(this._create(s.type, s.x, s.y));
        }
    },

    /** Create an enemy of a given type */
    _create(type, x, y) {
        const base = {
            type, x, y,
            startX: x, startY: y,
            w: 14, h: 14,
            hp: 1,
            speed: 0.6,
            dir: DIR.DOWN,
            state: 'idle',  // idle, moving, hurt, dead
            timer: 0,
            moveTimer: 0,
            hurtTimer: 0,
            knockX: 0, knockY: 0,
            flashTimer: 0,
            shootCooldown: 0,
            active: true,
        };

        switch (type) {
            case ENEMY.SLIME:
                base.hp = 1;
                base.speed = 0.4;
                base.w = 12; base.h = 12;
                break;
            case ENEMY.OCTOROK:
                base.hp = 2;
                base.speed = 0.6;
                base.shootCooldown = 120;
                break;
            case ENEMY.BAT:
                base.hp = 1;
                base.speed = 0.7;
                base.w = 10; base.h = 10;
                break;
            case ENEMY.DARKNUT:
                base.hp = 3;
                base.speed = 0.7;
                break;
            case ENEMY.BOSS:
                base.hp = 12;
                base.speed = 0.5;
                base.w = 24; base.h = 24;
                base.shootCooldown = 60;
                base.state = 'moving';
                break;
        }

        base.maxHp = base.hp;
        return base;
    },

    /** Update all enemies */
    update(playerX, playerY) {
        for (const e of this.list) {
            if (!e.active) continue;

            // Hurt state (knockback)
            if (e.hurtTimer > 0) {
                e.hurtTimer--;
                e.x += e.knockX;
                e.y += e.knockY;
                // Clamp to screen
                e.x = Math.max(0, Math.min(GAME_W - e.w, e.x));
                e.y = Math.max(0, Math.min(GAME_H - e.h, e.y));
                e.flashTimer = e.hurtTimer;
                continue;
            }

            e.timer++;

            switch (e.type) {
                case ENEMY.SLIME:   this._aiSlime(e, playerX, playerY); break;
                case ENEMY.OCTOROK: this._aiOctorok(e, playerX, playerY); break;
                case ENEMY.BAT:     this._aiBat(e, playerX, playerY); break;
                case ENEMY.DARKNUT: this._aiDarknut(e, playerX, playerY); break;
                case ENEMY.BOSS:    this._aiBoss(e, playerX, playerY); break;
            }
        }

        // Remove dead enemies
        this.list = this.list.filter(e => e.active);
    },

    // -- AI Behaviors --

    /** Slime: random walk, slow */
    _aiSlime(e, px, py) {
        e.moveTimer--;
        if (e.moveTimer <= 0) {
            // Pick a random direction
            e.dir = Math.floor(Math.random() * 4);
            e.moveTimer = 30 + Math.floor(Math.random() * 60);
            if (Math.random() < 0.3) {
                e.state = 'idle';
                return;
            }
            e.state = 'moving';
        }
        if (e.state === 'moving') {
            this._moveInDir(e, e.dir, e.speed);
        }
    },

    /** Octorok: walk cardinal, stop and shoot */
    _aiOctorok(e, px, py) {
        e.moveTimer--;
        e.shootCooldown--;

        if (e.shootCooldown <= 0) {
            // Shoot toward player
            e.state = 'idle';
            const dx = px - e.x;
            const dy = py - e.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0 && dist < 100) {
                Items.spawnProjectile(
                    e.x + e.w / 2 - 3,
                    e.y + e.h / 2 - 3,
                    (dx / dist) * 0.9,
                    (dy / dist) * 0.9,
                    true
                );
            }
            e.shootCooldown = 90 + Math.floor(Math.random() * 60);
            e.moveTimer = 30;
            return;
        }

        if (e.moveTimer <= 0) {
            e.dir = Math.floor(Math.random() * 4);
            e.moveTimer = 40 + Math.floor(Math.random() * 40);
            e.state = 'moving';
        }
        if (e.state === 'moving') {
            this._moveInDir(e, e.dir, e.speed);
        }
    },

    /** Bat: fast erratic movement toward player */
    _aiBat(e, px, py) {
        e.moveTimer--;
        if (e.moveTimer <= 0) {
            // Bias toward player with randomness
            const dx = px - e.x + (Math.random() - 0.5) * 80;
            const dy = py - e.y + (Math.random() - 0.5) * 80;
            const dist = Math.hypot(dx, dy);
            if (dist > 0) {
                e._vx = (dx / dist) * e.speed;
                e._vy = (dy / dist) * e.speed;
            }
            e.moveTimer = 20 + Math.floor(Math.random() * 30);
        }
        if (e._vx !== undefined) {
            const nx = e.x + e._vx;
            const ny = e.y + e._vy;
            // Bats fly over obstacles but stay on screen
            e.x = Math.max(TILE, Math.min(GAME_W - TILE - e.w, nx));
            e.y = Math.max(TILE, Math.min(GAME_H - TILE - e.h, ny));
        }
    },

    /** Darknut: chase player, tougher */
    _aiDarknut(e, px, py) {
        e.moveTimer--;
        if (e.moveTimer <= 0) {
            // Move toward player
            const dx = px - e.x;
            const dy = py - e.y;
            if (Math.abs(dx) > Math.abs(dy)) {
                e.dir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
            } else {
                e.dir = dy > 0 ? DIR.DOWN : DIR.UP;
            }
            e.moveTimer = 15 + Math.floor(Math.random() * 20);
            e.state = 'moving';
        }
        if (e.state === 'moving') {
            this._moveInDir(e, e.dir, e.speed);
        }
    },

    /** Boss: pattern - move, pause, shoot spread, repeat */
    _aiBoss(e, px, py) {
        e.moveTimer--;
        e.shootCooldown--;

        if (e.shootCooldown <= 0) {
            // Shoot 3 projectiles in a spread
            const dx = px - e.x;
            const dy = py - e.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0) {
                const baseAngle = Math.atan2(dy, dx);
                for (let i = -1; i <= 1; i++) {
                    const angle = baseAngle + i * 0.3;
                    Items.spawnProjectile(
                        e.x + e.w / 2 - 3,
                        e.y + e.h / 2 - 3,
                        Math.cos(angle) * 0.8,
                        Math.sin(angle) * 0.8,
                        true
                    );
                }
            }
            e.shootCooldown = 70 + Math.floor(Math.random() * 40);
        }

        if (e.moveTimer <= 0) {
            const dx = px - e.x + (Math.random() - 0.5) * 60;
            const dy = py - e.y + (Math.random() - 0.5) * 60;
            const dist = Math.hypot(dx, dy);
            if (dist > 0) {
                e.dir = Math.abs(dx) > Math.abs(dy)
                    ? (dx > 0 ? DIR.RIGHT : DIR.LEFT)
                    : (dy > 0 ? DIR.DOWN : DIR.UP);
            }
            e.moveTimer = 30 + Math.floor(Math.random() * 40);
            e.state = 'moving';
        }

        if (e.state === 'moving') {
            this._moveInDir(e, e.dir, e.speed);
        }
    },

    /** Move an enemy in a direction with wall collision */
    _moveInDir(e, dir, speed) {
        let dx = 0, dy = 0;
        const scaled_speed = speed * 0.6;
        switch (dir) {
            case DIR.UP:    dy = -scaled_speed * 0.3; break;
            case DIR.DOWN:  dy = scaled_speed; break;
            case DIR.LEFT:  dx = -scaled_speed; break;
            case DIR.RIGHT: dx = scaled_speed; break;
        }

        const nx = e.x + dx;
        const ny = e.y + dy;

        // Stay within screen bounds (2 tile margin for non-boss)
        const margin = e.type === ENEMY.BOSS ? TILE * 2 : TILE;

        if (nx >= margin && nx + e.w <= GAME_W - margin) {
            if (!World.collides(nx, e.y, e.w, e.h)) {
                e.x = nx;
            } else {
                e.moveTimer = 0; // Change direction
            }
        } else {
            e.moveTimer = 0;
        }

        if (ny >= margin && ny + e.h <= GAME_H - margin) {
            if (!World.collides(e.x, ny, e.w, e.h)) {
                e.y = ny;
            } else {
                e.moveTimer = 0;
            }
        } else {
            e.moveTimer = 0;
        }
    },

    /** Deal damage to an enemy */
    damage(enemy, amount, knockDir) {
        if (enemy.hurtTimer > 0) return;
        enemy.hp -= amount;
        enemy.hurtTimer = 20;
        enemy.flashTimer = 20;

        // Knockback
        const kb = 2;
        switch (knockDir) {
            case DIR.UP:    enemy.knockX = 0; enemy.knockY = -kb; break;
            case DIR.DOWN:  enemy.knockX = 0; enemy.knockY = kb; break;
            case DIR.LEFT:  enemy.knockX = -kb; enemy.knockY = 0; break;
            case DIR.RIGHT: enemy.knockX = kb; enemy.knockY = 0; break;
        }

        if (enemy.hp <= 0) {
            enemy.active = false;
            this._onDeath(enemy);
        }
    },

    /** Handle enemy death - drop items */
    _onDeath(enemy) {
        // Random drops
        const roll = Math.random();
        if (enemy.type === ENEMY.BOSS) {
            // Boss drops heart container
            Items.spawnPickup(enemy.x + 4, enemy.y + 4, 'heart_container');
            Items.spawnPickup(enemy.x + 16, enemy.y + 4, 'boss_key');
        } else if (roll < 0.25) {
            Items.spawnPickup(enemy.x, enemy.y, 'heart');
        } else if (roll < 0.35) {
            Items.spawnPickup(enemy.x, enemy.y, 'bomb_ammo');
        }

        // Check if room is cleared
        if (World.inDungeon) {
            const remaining = this.list.filter(e => e.active && e !== enemy);
            if (remaining.length === 0) {
                const key = 'd:' + World.screenX + ',' + World.screenY;
                World.clearedRooms[key] = true;

                // In the key room (0,1), drop a key when cleared
                if (World.screenX === 0 && World.screenY === 1) {
                    Items.spawnPickup(7 * TILE, 5 * TILE, 'key');
                }
            }
        }
    },

    /** Check collision between player's attack hitbox and enemies */
    checkSwordHit(hx, hy, hw, hh, dir) {
        for (const e of this.list) {
            if (!e.active || e.hurtTimer > 0) continue;
            if (Items._rectsOverlap(hx, hy, hw, hh, e.x, e.y, e.w, e.h)) {
                this.damage(e, 1, dir);
            }
        }
    },

    /** Check collision between enemies and a point/rect (for player damage) */
    checkContact(px, py, pw, ph) {
        for (const e of this.list) {
            if (!e.active || e.hurtTimer > 0) continue;
            if (Items._rectsOverlap(px, py, pw, ph, e.x, e.y, e.w, e.h)) {
                return e;
            }
        }
        return null;
    },

    /** Are all enemies dead? */
    allDead() {
        return this.list.filter(e => e.active).length === 0;
    },
};
