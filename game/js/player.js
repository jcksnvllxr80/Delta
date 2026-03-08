/* ===================================================
   player.js - Player state, movement, combat
   =================================================== */

const Player = {
    // Position (top-left of 16x16 sprite, in screen-pixel coords)
    x: 0,
    y: 0,

    // Hitbox offset from position
    hbOx: 2, hbOy: 4,
    hbW: 12, hbH: 12,

    // State
    hp: 6,
    maxHp: 6,
    dir: DIR.DOWN,
    state: 'idle',  // idle, walking, attacking, hurt

    // Timers
    attackTimer: 0,
    invulnTimer: 0,
    hurtTimer: 0,
    knockDx: 0,
    knockDy: 0,

    // Inventory
    hasSword: true,
    hasBombs: false,
    hasBossKey: false,
    keys: 0,
    bombCount: 0,
    maxBombs: 8,

    // Animation
    walkFrame: 0,
    walkTimer: 0,

    // Previous overworld position (for dungeon exit)
    savedOverworldX: 0,
    savedOverworldY: 0,

    /** Initialize player at starting position */
    init() {
        this.x = 7 * TILE;
        this.y = 5 * TILE;
        this.hp = this.maxHp;
        this.dir = DIR.DOWN;
        this.state = 'idle';
        this.attackTimer = 0;
        this.invulnTimer = 0;
    },

    /** Main update - called each frame during PLAYING state */
    update() {
        // Invulnerability countdown
        if (this.invulnTimer > 0) this.invulnTimer--;

        // Hurt state (knockback)
        if (this.hurtTimer > 0) {
            this.hurtTimer--;
            const nx = this.x + this.knockDx;
            const ny = this.y + this.knockDy;
            if (!World.collides(nx + this.hbOx, this.y + this.hbOy, this.hbW, this.hbH)) {
                this.x = nx;
            }
            if (!World.collides(this.x + this.hbOx, ny + this.hbOy, this.hbW, this.hbH)) {
                this.y = ny;
            }
            this.x = Math.max(0, Math.min(GAME_W - TILE, this.x));
            this.y = Math.max(0, Math.min(GAME_H - TILE, this.y));
            return null; // No screen transition during knockback
        }

        // Attack state
        if (this.attackTimer > 0) {
            this.attackTimer--;
            if (this.attackTimer === ATTACK_DURATION - 3) {
                // Sword hitbox check on the active frame
                this._swordHitCheck();
            }
            if (this.attackTimer <= 0) {
                this.state = 'idle';
            }
            return null;
        }

        // Handle attack input
        if (Input.isPressed('KeyZ') || Input.isPressed('Space')) {
            if (this.hasSword) {
                this.state = 'attacking';
                this.attackTimer = ATTACK_DURATION;
                return null;
            }
        }

        // Handle item use (bombs)
        if (Input.isPressed('KeyX')) {
            if (this.hasBombs && this.bombCount > 0) {
                this.bombCount--;
                let bx = this.x + 2;
                let by = this.y + 2;
                switch (this.dir) {
                    case DIR.UP:    by -= TILE; break;
                    case DIR.DOWN:  by += TILE; break;
                    case DIR.LEFT:  bx -= TILE; break;
                    case DIR.RIGHT: bx += TILE; break;
                }
                Items.spawnBomb(bx, by);
            }
        }

        // Movement
        let dx = 0, dy = 0;
        if (Input.isDown('ArrowUp')    || Input.isDown('KeyW')) { dy = -PLAYER_SPEED; this.dir = DIR.UP; }
        if (Input.isDown('ArrowDown')  || Input.isDown('KeyS')) { dy = PLAYER_SPEED;  this.dir = DIR.DOWN; }
        if (Input.isDown('ArrowLeft')  || Input.isDown('KeyA')) { dx = -PLAYER_SPEED; this.dir = DIR.LEFT; }
        if (Input.isDown('ArrowRight') || Input.isDown('KeyD')) { dx = PLAYER_SPEED;  this.dir = DIR.RIGHT; }

        // Prioritize last direction pressed (no diagonal)
        if (dx !== 0 && dy !== 0) {
            // Keep only the latest axis
            if (Input.isPressed('ArrowUp') || Input.isPressed('ArrowDown') ||
                Input.isPressed('KeyW') || Input.isPressed('KeyS')) {
                dx = 0;
            } else {
                dy = 0;
            }
        }

        if (dx !== 0 || dy !== 0) {
            this.state = 'walking';
            this.walkTimer++;
            if (this.walkTimer >= 8) {
                this.walkTimer = 0;
                this.walkFrame = (this.walkFrame + 1) % 2;
            }

            // Grid alignment assist (nudge toward grid when moving on one axis)
            if (dx !== 0 && dy === 0) {
                const gridY = Math.round(this.y / (TILE / 2)) * (TILE / 2);
                if (Math.abs(this.y - gridY) < 3) this.y += Math.sign(gridY - this.y) * 0.5;
            }
            if (dy !== 0 && dx === 0) {
                const gridX = Math.round(this.x / (TILE / 2)) * (TILE / 2);
                if (Math.abs(this.x - gridX) < 3) this.x += Math.sign(gridX - this.x) * 0.5;
            }

            // Apply movement with collision
            const newX = this.x + dx;
            const newY = this.y + dy;

            if (!World.collides(newX + this.hbOx, this.y + this.hbOy, this.hbW, this.hbH)) {
                this.x = newX;
            }
            if (!World.collides(this.x + this.hbOx, newY + this.hbOy, this.hbW, this.hbH)) {
                this.y = newY;
            }

            // Auto-open doors when walking toward them
            if ((this.dir === DIR.UP && dy < 0) || (this.dir === DIR.DOWN && dy > 0) ||
                (this.dir === DIR.LEFT && dx < 0) || (this.dir === DIR.RIGHT && dx > 0)) {
                const front = this.checkFrontTile();
                if (front.tile === TL.DOOR_LOCKED && this.keys > 0) {
                    this.keys--;
                    this._openAllDoorsOfType(TL.DOOR_LOCKED);
                    Game.showMessage('Door opened!');
                }
                if (front.tile === TL.BOSS_DOOR && this.hasBossKey) {
                    this._openAllDoorsOfType(TL.BOSS_DOOR);
                    Game.showMessage('Boss door opened!');
                }
            }
        } else {
            this.state = 'idle';
            this.walkTimer = 0;
        }

        // Check screen transitions
        return this._checkScreenEdge();
    },

    /** Check for and handle screen-edge transitions */
    _checkScreenEdge() {
        if (this.x < -2) {
            return { dir: DIR.LEFT, nx: GAME_W - TILE - 1, ny: this.y };
        }
        if (this.x + TILE > GAME_W + 2) {
            return { dir: DIR.RIGHT, nx: 1, ny: this.y };
        }
        if (this.y < -2) {
            return { dir: DIR.UP, nx: this.x, ny: GAME_H - TILE - 1 };
        }
        if (this.y + TILE > GAME_H + 2) {
            return { dir: DIR.DOWN, nx: this.x, ny: 1 };
        }
        return null;
    },

    /** Check for tile interactions at player's feet */
    checkTileInteraction() {
        const cx = Math.floor((this.x + 8) / TILE);
        const cy = Math.floor((this.y + 8) / TILE);
        const tile = World.getTile(cx, cy);

        // Dungeon entrance
        if (tile === TL.DUNGEON) {
            return 'enter_dungeon';
        }

        // Stairs (dungeon exit)
        if (tile === TL.STAIRS) {
            return 'exit_dungeon';
        }

        // Cave (gives item / message)
        if (tile === TL.CAVE) {
            return 'cave_interact';
        }

        // Goal
        if (tile === TL.GOAL) {
            return 'victory';
        }

        return null;
    },

    /** Check interaction with tile in front of player (for chests, etc.) */
    checkFrontTile() {
        let fx = Math.floor((this.x + 8) / TILE);
        let fy = Math.floor((this.y + 8) / TILE);
        switch (this.dir) {
            case DIR.UP:    fy--; break;
            case DIR.DOWN:  fy++; break;
            case DIR.LEFT:  fx--; break;
            case DIR.RIGHT: fx++; break;
        }
        return { col: fx, row: fy, tile: World.getTile(fx, fy) };
    },

    /** Sword hitbox check */
    _swordHitCheck() {
        const swordLen = 14;
        const swordWid = 10;
        let sx, sy, sw, sh;

        switch (this.dir) {
            case DIR.UP:
                sx = this.x + 3; sy = this.y - swordLen + 2;
                sw = swordWid; sh = swordLen;
                break;
            case DIR.DOWN:
                sx = this.x + 3; sy = this.y + 14;
                sw = swordWid; sh = swordLen;
                break;
            case DIR.LEFT:
                sx = this.x - swordLen + 2; sy = this.y + 3;
                sw = swordLen; sh = swordWid;
                break;
            case DIR.RIGHT:
                sx = this.x + 14; sy = this.y + 3;
                sw = swordLen; sh = swordWid;
                break;
        }

        // Hit enemies
        Enemies.checkSwordHit(sx, sy, sw, sh, this.dir);

        // Cut bushes
        const frontTile = this.checkFrontTile();
        if (frontTile.tile === TL.BUSH) {
            World.destroyTile(frontTile.col, frontTile.row,
                World.inDungeon ? TL.FLOOR : TL.GRASS);
            // Small chance to find a heart in a bush
            if (Math.random() < 0.2) {
                Items.spawnPickup(
                    frontTile.col * TILE + 3,
                    frontTile.row * TILE + 3,
                    'heart'
                );
            }
        }

        // Interact with chest
        if (frontTile.tile === TL.CHEST) {
            this._openChest(frontTile.col, frontTile.row);
        }

        // Try locked door with key
        if (frontTile.tile === TL.DOOR_LOCKED && this.keys > 0) {
            this.keys--;
            this._openAllDoorsOfType(TL.DOOR_LOCKED);
            Game.showMessage('Door opened!');
            return 'door_opened';
        }

        // Try boss door with boss key
        if (frontTile.tile === TL.BOSS_DOOR && this.hasBossKey) {
            this._openAllDoorsOfType(TL.BOSS_DOOR);
            Game.showMessage('Boss door opened!');
            return 'boss_door_opened';
        }
    },

    /** Open a chest */
    _openChest(col, row) {
        const screenItems = World.getScreenItems();
        let itemType = 'bomb_ammo'; // default

        // Check if this chest has a specific item
        for (const item of screenItems) {
            if (item.tileX === col && item.tileY === row) {
                itemType = item.type;
                break;
            }
        }

        World.markChestOpened(col, row);

        // Apply item
        switch (itemType) {
            case 'bombs':
                this.hasBombs = true;
                this.bombCount = 8;
                Game.showMessage('You found BOMBS!\nPress X to use.');
                break;
            case 'heart_container':
                this.maxHp += 2;
                this.hp = this.maxHp;
                Game.showMessage('Heart Container!\nHP increased!');
                break;
            case 'bomb_ammo':
                this.bombCount = Math.min(this.maxBombs, this.bombCount + 4);
                Game.showMessage('Found 4 bombs!');
                break;
            case 'key':
                this.keys++;
                Game.showMessage('Found a KEY!');
                break;
        }
    },

    /** Open all door tiles of a given type on the current screen */
    _openAllDoorsOfType(tileType) {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (World.getTile(c, r) === tileType) {
                    World.destroyTile(c, r, World.inDungeon ? TL.FLOOR : TL.PATH);
                }
            }
        }
    },

    /** Take damage from an enemy or hazard */
    takeDamage(amount, fromDir) {
        if (this.invulnTimer > 0) return;

        this.hp -= amount;
        this.invulnTimer = INVULN_TIME;
        this.hurtTimer = KNOCKBACK_FRAMES;
        this.state = 'hurt';

        // Knockback direction (away from damage source)
        const kb = KNOCKBACK_SPEED;
        switch (fromDir) {
            case DIR.UP:    this.knockDx = 0; this.knockDy = kb; break;
            case DIR.DOWN:  this.knockDx = 0; this.knockDy = -kb; break;
            case DIR.LEFT:  this.knockDx = kb; this.knockDy = 0; break;
            case DIR.RIGHT: this.knockDx = -kb; this.knockDy = 0; break;
            default:        this.knockDx = 0; this.knockDy = -kb; break;
        }

        if (this.hp <= 0) {
            this.hp = 0;
        }
    },

    /** Collect a pickup item */
    collectPickup(pickup) {
        switch (pickup.type) {
            case 'heart':
                this.hp = Math.min(this.maxHp, this.hp + 2);
                break;
            case 'heart_container':
                this.maxHp += 2;
                this.hp = this.maxHp;
                Game.showMessage('Heart Container!\nHP increased!');
                break;
            case 'key':
                this.keys++;
                break;
            case 'boss_key':
                this.hasBossKey = true;
                Game.showMessage('Boss Key found!');
                break;
            case 'bomb_ammo':
                if (this.hasBombs) {
                    this.bombCount = Math.min(this.maxBombs, this.bombCount + 4);
                }
                break;
            case 'bombs':
                this.hasBombs = true;
                this.bombCount = 8;
                Game.showMessage('You found BOMBS!\nPress X to use.');
                break;
        }
    },
};
