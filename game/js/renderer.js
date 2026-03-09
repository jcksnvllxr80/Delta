/* ===================================================
   renderer.js - All canvas drawing
   =================================================== */

const Renderer = {
    canvas: null,
    ctx: null,

    init() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
    },

    /** Clear whole canvas */
    clear() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    },

    // ===============================================================
    //  TILE RENDERING
    // ===============================================================

    /** Draw a full screen of tiles at an offset (for transitions) */
    drawTiles(tiles, ox, oy) {
        const ctx = this.ctx;
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const t = tiles[row] ? tiles[row][col] : TL.GRASS;
                const x = ox + col * TILE;
                const y = oy + row * TILE + HUD_H;

                // Base color
                ctx.fillStyle = TILE_COLORS[t] || '#000';
                ctx.fillRect(x, y, TILE, TILE);

                // Detail rendering for specific tiles
                this._drawTileDetail(ctx, t, x, y);
            }
        }
    },

    /** Draw small details on specific tile types */
    _drawTileDetail(ctx, t, x, y) {
        switch (t) {
            case TL.TREE:
                // Tree trunk
                ctx.fillStyle = '#531';
                ctx.fillRect(x + 6, y + 10, 4, 6);
                // Leaf pattern
                ctx.fillStyle = TILE_DETAIL[TL.TREE];
                ctx.fillRect(x + 3, y + 2, 10, 9);
                ctx.fillStyle = '#2b5';
                ctx.fillRect(x + 5, y + 1, 6, 4);
                break;

            case TL.WATER:
                // Wave pattern
                ctx.fillStyle = TILE_DETAIL[TL.WATER];
                ctx.fillRect(x + 2, y + 4, 6, 2);
                ctx.fillRect(x + 10, y + 10, 4, 2);
                break;

            case TL.ROCK:
                // Cracks/shading
                ctx.fillStyle = TILE_DETAIL[TL.ROCK];
                ctx.fillRect(x + 1, y + 1, TILE - 2, 2);
                ctx.fillStyle = '#776';
                ctx.fillRect(x + 3, y + 6, 4, 2);
                break;

            case TL.BUSH:
                // Round bush shape
                ctx.fillStyle = TILE_DETAIL[TL.BUSH];
                ctx.fillRect(x + 2, y + 2, 12, 12);
                ctx.fillStyle = '#4c5';
                ctx.fillRect(x + 4, y + 4, 8, 8);
                break;

            case TL.PATH:
                // Dirt path specks
                ctx.fillStyle = '#b96';
                ctx.fillRect(x + 3, y + 5, 2, 2);
                ctx.fillRect(x + 10, y + 9, 2, 2);
                break;

            case TL.WALL:
                // Brick pattern
                ctx.fillStyle = TILE_DETAIL[TL.WALL];
                ctx.fillRect(x, y, TILE, 1);
                ctx.fillRect(x, y + 8, TILE, 1);
                ctx.fillRect(x + 7, y, 1, 8);
                ctx.fillRect(x + 3, y + 8, 1, 8);
                ctx.fillRect(x + 11, y + 8, 1, 8);
                break;

            case TL.CAVE:
                // Dark entrance shape
                ctx.fillStyle = '#444';
                ctx.fillRect(x + 2, y, 12, 16);
                ctx.fillStyle = '#111';
                ctx.fillRect(x + 4, y + 4, 8, 12);
                break;

            case TL.DUNGEON:
                // Dungeon entrance
                ctx.fillStyle = '#645';
                ctx.fillRect(x + 1, y, 14, 16);
                ctx.fillStyle = '#211';
                ctx.fillRect(x + 4, y + 6, 8, 10);
                ctx.fillStyle = '#867';
                ctx.fillRect(x + 3, y, 10, 3);
                break;

            case TL.CRACKED:
                // Cracked wall detail
                ctx.fillStyle = TILE_DETAIL[TL.CRACKED];
                ctx.fillRect(x + 3, y + 2, 1, 6);
                ctx.fillRect(x + 8, y + 5, 1, 8);
                ctx.fillRect(x + 12, y + 1, 1, 5);
                break;

            case TL.CHEST:
                // Treasure chest
                ctx.fillStyle = TILE_DETAIL[TL.CHEST];
                ctx.fillRect(x + 2, y + 4, 12, 8);
                ctx.fillStyle = '#fd4';
                ctx.fillRect(x + 6, y + 6, 4, 3);
                ctx.fillStyle = '#a70';
                ctx.fillRect(x + 2, y + 3, 12, 2);
                break;

            case TL.STAIRS:
                // Staircase
                ctx.fillStyle = '#668';
                ctx.fillRect(x + 2, y + 2, 12, 3);
                ctx.fillRect(x + 4, y + 5, 10, 3);
                ctx.fillRect(x + 6, y + 8, 8, 3);
                ctx.fillRect(x + 8, y + 11, 6, 3);
                break;

            case TL.DOOR_LOCKED:
                // Locked door
                ctx.fillStyle = '#c84';
                ctx.fillRect(x + 3, y + 2, 10, 12);
                ctx.fillStyle = '#fd2';
                ctx.fillRect(x + 9, y + 7, 3, 3);
                break;

            case TL.BOSS_DOOR:
                // Boss door (ominous)
                ctx.fillStyle = '#c33';
                ctx.fillRect(x + 3, y + 2, 10, 12);
                ctx.fillStyle = '#fd2';
                ctx.fillRect(x + 6, y + 5, 4, 4);
                break;

            case TL.GOAL:
                // Sacred artifact (triangle/delta shape)
                ctx.fillStyle = '#fe4';
                ctx.beginPath();
                ctx.moveTo(x + 8, y + 2);
                ctx.lineTo(x + 14, y + 13);
                ctx.lineTo(x + 2, y + 13);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#fd2';
                ctx.beginPath();
                ctx.moveTo(x + 8, y + 5);
                ctx.lineTo(x + 12, y + 12);
                ctx.lineTo(x + 4, y + 12);
                ctx.closePath();
                ctx.fill();
                break;

            case TL.BRIDGE:
                ctx.fillStyle = '#974';
                ctx.fillRect(x, y + 2, TILE, 2);
                ctx.fillRect(x, y + 12, TILE, 2);
                break;

            case TL.FLOOR_ALT:
                ctx.fillStyle = '#556';
                ctx.fillRect(x + 6, y + 6, 4, 4);
                break;

            case TL.GRASS:
                // Subtle grass detail
                ctx.fillStyle = '#5b5';
                ctx.fillRect(x + 3, y + 7, 2, 2);
                ctx.fillRect(x + 11, y + 3, 2, 2);
                break;

            case TL.SAND:
                ctx.fillStyle = '#db7';
                ctx.fillRect(x + 4, y + 6, 2, 2);
                ctx.fillRect(x + 10, y + 11, 2, 2);
                break;
        }
    },

    // ===============================================================
    //  ENTITY RENDERING
    // ===============================================================

    /** Draw the player */
    drawPlayer(p) {
        const ctx = this.ctx;
        const x = Math.round(p.x);
        const y = Math.round(p.y) + HUD_H;

        // Flicker when currently invulnerable
        if (Date.now() < p.invulnExpires && Math.floor((p.invulnExpires - Date.now()) / 50) % 2 === 0) {
            return;
        }

        // Sword (drawn behind or in front depending on direction)
        if (p.attackTimer > 0) {
            this._drawSword(ctx, x, y, p.dir, p.attackTimer);
        }

        // Body (green tunic)
        ctx.fillStyle = '#3a3';
        ctx.fillRect(x + 3, y + 5, 10, 9);

        // Head
        ctx.fillStyle = '#ecc';
        switch (p.dir) {
            case DIR.DOWN:
                ctx.fillRect(x + 4, y + 1, 8, 6);
                // Eyes
                ctx.fillStyle = '#222';
                ctx.fillRect(x + 5, y + 3, 2, 2);
                ctx.fillRect(x + 9, y + 3, 2, 2);
                break;
            case DIR.UP:
                ctx.fillRect(x + 4, y + 1, 8, 6);
                // Hair (seen from back)
                ctx.fillStyle = '#631';
                ctx.fillRect(x + 4, y + 1, 8, 4);
                break;
            case DIR.LEFT:
                ctx.fillRect(x + 3, y + 1, 7, 6);
                ctx.fillStyle = '#222';
                ctx.fillRect(x + 4, y + 3, 2, 2);
                break;
            case DIR.RIGHT:
                ctx.fillRect(x + 6, y + 1, 7, 6);
                ctx.fillStyle = '#222';
                ctx.fillRect(x + 10, y + 3, 2, 2);
                break;
        }

        // Hair
        ctx.fillStyle = '#631';
        if (p.dir === DIR.DOWN || p.dir === DIR.UP) {
            ctx.fillRect(x + 4, y, 8, 2);
        } else if (p.dir === DIR.LEFT) {
            ctx.fillRect(x + 3, y, 7, 2);
        } else {
            ctx.fillRect(x + 6, y, 7, 2);
        }

        // Legs/feet with walk animation
        ctx.fillStyle = '#853';
        if (p.state === 'walking') {
            if (p.walkFrame === 0) {
                ctx.fillRect(x + 4, y + 13, 3, 3);
                ctx.fillRect(x + 9, y + 12, 3, 3);
            } else {
                ctx.fillRect(x + 4, y + 12, 3, 3);
                ctx.fillRect(x + 9, y + 13, 3, 3);
            }
        } else {
            ctx.fillRect(x + 4, y + 13, 3, 3);
            ctx.fillRect(x + 9, y + 13, 3, 3);
        }
    },

    /** Draw sword attack */
    _drawSword(ctx, px, py, dir, timer) {
        const progress = 1 - (timer / ATTACK_DURATION);
        ctx.fillStyle = '#ddd';
        const sLen = 10;
        const sWid = 3;

        switch (dir) {
            case DIR.UP:
                ctx.fillRect(px + 7, py - sLen + 2, sWid, sLen);
                ctx.fillStyle = '#aaa';
                ctx.fillRect(px + 5, py + 1, 7, 2);
                break;
            case DIR.DOWN:
                ctx.fillRect(px + 6, py + 14, sWid, sLen);
                ctx.fillStyle = '#aaa';
                ctx.fillRect(px + 4, py + 12, 7, 2);
                break;
            case DIR.LEFT:
                ctx.fillRect(px - sLen + 2, py + 7, sLen, sWid);
                ctx.fillStyle = '#aaa';
                ctx.fillRect(px + 1, py + 5, 2, 7);
                break;
            case DIR.RIGHT:
                ctx.fillRect(px + 14, py + 7, sLen, sWid);
                ctx.fillStyle = '#aaa';
                ctx.fillRect(px + 12, py + 5, 2, 7);
                break;
        }
    },

    /** Draw an enemy */
    drawEnemy(e) {
        const ctx = this.ctx;
        const x = Math.round(e.x);
        const y = Math.round(e.y) + HUD_H;

        // Flash white when hurt
        if (e.flashTimer > 0 && Math.floor(e.flashTimer / 2) % 2 === 0) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(x, y, e.w, e.h);
            return;
        }

        switch (e.type) {
            case ENEMY.SLIME:
                // Green blob
                ctx.fillStyle = '#4d4';
                ctx.fillRect(x + 1, y + 4, 10, 8);
                ctx.fillRect(x + 3, y + 2, 6, 10);
                ctx.fillStyle = '#2a2';
                ctx.fillRect(x + 3, y + 6, 6, 4);
                // Eyes
                ctx.fillStyle = '#111';
                ctx.fillRect(x + 3, y + 5, 2, 2);
                ctx.fillRect(x + 7, y + 5, 2, 2);
                break;

            case ENEMY.OCTOROK:
                // Red octopus-like
                ctx.fillStyle = '#c44';
                ctx.fillRect(x + 2, y + 2, 10, 10);
                ctx.fillStyle = '#a33';
                ctx.fillRect(x + 1, y + 10, 3, 4);
                ctx.fillRect(x + 5, y + 10, 3, 4);
                ctx.fillRect(x + 9, y + 10, 3, 4);
                // Eyes
                ctx.fillStyle = '#fff';
                ctx.fillRect(x + 3, y + 4, 3, 3);
                ctx.fillRect(x + 8, y + 4, 3, 3);
                ctx.fillStyle = '#111';
                ctx.fillRect(x + 4, y + 5, 2, 2);
                ctx.fillRect(x + 9, y + 5, 2, 2);
                break;

            case ENEMY.BAT:
                // Purple bat
                ctx.fillStyle = '#a6c';
                ctx.fillRect(x + 3, y + 3, 6, 6);
                // Wings
                if (Math.floor(e.timer / 8) % 2 === 0) {
                    ctx.fillRect(x, y + 2, 3, 5);
                    ctx.fillRect(x + 9, y + 2, 3, 5);
                } else {
                    ctx.fillRect(x, y + 4, 3, 5);
                    ctx.fillRect(x + 9, y + 4, 3, 5);
                }
                // Eyes
                ctx.fillStyle = '#f44';
                ctx.fillRect(x + 4, y + 4, 2, 2);
                ctx.fillRect(x + 7, y + 4, 2, 2);
                break;

            case ENEMY.DARKNUT:
                // Armored knight
                ctx.fillStyle = '#447';
                ctx.fillRect(x + 2, y + 3, 10, 10);
                // Helmet
                ctx.fillStyle = '#669';
                ctx.fillRect(x + 3, y + 1, 8, 5);
                // Visor
                ctx.fillStyle = '#111';
                ctx.fillRect(x + 5, y + 3, 4, 2);
                // Shield based on direction
                ctx.fillStyle = '#558';
                if (e.dir === DIR.LEFT) {
                    ctx.fillRect(x, y + 4, 3, 8);
                } else if (e.dir === DIR.RIGHT) {
                    ctx.fillRect(x + 11, y + 4, 3, 8);
                }
                break;

            case ENEMY.BOSS:
                // Large dragon-like boss
                ctx.fillStyle = '#a33';
                ctx.fillRect(x + 2, y + 2, 20, 20);
                // Head
                ctx.fillStyle = '#c44';
                ctx.fillRect(x + 4, y, 16, 10);
                // Eyes
                ctx.fillStyle = '#ff0';
                ctx.fillRect(x + 7, y + 3, 4, 3);
                ctx.fillRect(x + 15, y + 3, 4, 3);
                ctx.fillStyle = '#000';
                ctx.fillRect(x + 8, y + 4, 2, 2);
                ctx.fillRect(x + 16, y + 4, 2, 2);
                // Horns
                ctx.fillStyle = '#866';
                ctx.fillRect(x + 4, y - 2, 3, 4);
                ctx.fillRect(x + 17, y - 2, 3, 4);
                // Health bar
                if (e.hp < e.maxHp) {
                    ctx.fillStyle = '#333';
                    ctx.fillRect(x, y - 5, 24, 3);
                    ctx.fillStyle = '#f33';
                    ctx.fillRect(x, y - 5, Math.floor(24 * e.hp / e.maxHp), 3);
                }
                break;
        }
    },

    // ===============================================================
    //  ITEMS / PROJECTILES
    // ===============================================================

    drawPickups() {
        const ctx = this.ctx;
        for (const p of Items.pickups) {
            const x = Math.round(p.x);
            const y = Math.round(p.y) + HUD_H;
            const bob = Math.sin(p.timer * 0.1) * 1.5;

            switch (p.type) {
                case 'heart':
                    ctx.fillStyle = '#f44';
                    ctx.fillRect(x + 1, y + bob + 2, 3, 3);
                    ctx.fillRect(x + 5, y + bob + 2, 3, 3);
                    ctx.fillRect(x, y + bob + 4, 9, 4);
                    ctx.fillRect(x + 1, y + bob + 7, 7, 2);
                    ctx.fillRect(x + 2, y + bob + 8, 5, 1);
                    break;
                case 'heart_container':
                    ctx.fillStyle = '#f22';
                    ctx.fillRect(x, y + bob + 1, 4, 4);
                    ctx.fillRect(x + 6, y + bob + 1, 4, 4);
                    ctx.fillRect(x - 1, y + bob + 3, 12, 5);
                    ctx.fillRect(x + 1, y + bob + 7, 8, 2);
                    ctx.fillRect(x + 3, y + bob + 8, 4, 2);
                    break;
                case 'key':
                    ctx.fillStyle = '#fd2';
                    ctx.fillRect(x + 3, y + bob, 4, 4);
                    ctx.fillRect(x + 4, y + bob + 4, 2, 6);
                    ctx.fillRect(x + 5, y + bob + 7, 3, 2);
                    break;
                case 'boss_key':
                    ctx.fillStyle = '#f92';
                    ctx.fillRect(x + 2, y + bob, 6, 5);
                    ctx.fillRect(x + 4, y + bob + 5, 2, 6);
                    ctx.fillRect(x + 5, y + bob + 8, 4, 2);
                    break;
                case 'bomb_ammo':
                    ctx.fillStyle = '#333';
                    ctx.fillRect(x + 2, y + bob + 3, 6, 7);
                    ctx.fillStyle = '#555';
                    ctx.fillRect(x + 3, y + bob + 2, 4, 2);
                    ctx.fillStyle = '#fa0';
                    ctx.fillRect(x + 4, y + bob, 2, 3);
                    break;
            }
        }
    },

    drawBombs() {
        const ctx = this.ctx;
        for (const b of Items.bombs) {
            const x = Math.round(b.x);
            const y = Math.round(b.y) + HUD_H;

            if (b.exploded) {
                // Explosion
                const r = 20 - b.explosionTimer;
                ctx.fillStyle = `rgba(255, ${150 + b.explosionTimer * 5}, 0, ${b.explosionTimer / 20})`;
                ctx.beginPath();
                ctx.arc(x + 6, y + 6, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = `rgba(255, 255, 200, ${b.explosionTimer / 30})`;
                ctx.beginPath();
                ctx.arc(x + 6, y + 6, r * 0.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Bomb body
                ctx.fillStyle = '#333';
                ctx.fillRect(x + 2, y + 3, 8, 9);
                ctx.fillRect(x + 1, y + 5, 10, 5);
                // Fuse
                ctx.fillStyle = b.timer % 10 < 5 ? '#fa0' : '#f00';
                ctx.fillRect(x + 5, y, 2, 4);
            }
        }
    },

    drawProjectiles() {
        const ctx = this.ctx;
        for (const p of Items.projectiles) {
            const x = Math.round(p.x);
            const y = Math.round(p.y) + HUD_H;
            ctx.fillStyle = p.fromEnemy ? '#f84' : '#4af';
            ctx.fillRect(x, y, p.w, p.h);
            ctx.fillStyle = p.fromEnemy ? '#fc6' : '#8cf';
            ctx.fillRect(x + 1, y + 1, p.w - 2, p.h - 2);
        }
    },

    // ===============================================================
    //  HUD
    // ===============================================================

    drawHUD(player) {
        const ctx = this.ctx;

        // HUD background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, CANVAS_W, HUD_H);

        // Border line
        ctx.fillStyle = '#555';
        ctx.fillRect(0, HUD_H - 1, CANVAS_W, 1);

        // Hearts (top right area)
        const heartsStartX = CANVAS_W - 10;
        for (let i = 0; i < Math.floor(player.maxHp / 2); i++) {
            const hx = heartsStartX - (i + 1) * 10;
            const hy = 4;
            const full = player.hp >= (i + 1) * 2;
            const half = player.hp >= i * 2 + 1;

            if (full) {
                ctx.fillStyle = '#f22';
            } else if (half) {
                ctx.fillStyle = '#f88';
            } else {
                ctx.fillStyle = '#444';
            }

            // Heart shape
            ctx.fillRect(hx, hy + 1, 3, 3);
            ctx.fillRect(hx + 4, hy + 1, 3, 3);
            ctx.fillRect(hx - 1, hy + 3, 9, 3);
            ctx.fillRect(hx, hy + 5, 7, 2);
            ctx.fillRect(hx + 1, hy + 6, 5, 2);
            ctx.fillRect(hx + 2, hy + 7, 3, 1);
        }

        // Item display (left side)
        // B button label
        ctx.fillStyle = '#888';
        this._drawText(ctx, 4, 3, 'B', 1);

        // Equipped item box
        ctx.fillStyle = '#333';
        ctx.fillRect(12, 2, 14, 14);
        ctx.strokeStyle = '#666';
        ctx.strokeRect(12, 2, 14, 14);

        if (player.hasBombs) {
            // Draw bomb icon
            ctx.fillStyle = '#555';
            ctx.fillRect(16, 5, 6, 8);
            ctx.fillStyle = '#fa0';
            ctx.fillRect(18, 3, 2, 3);
        }

        // Bomb count
        if (player.hasBombs) {
            ctx.fillStyle = '#fff';
            this._drawText(ctx, 30, 5, 'x' + player.bombCount, 1);
        }

        // Key count
        if (player.keys > 0 || World.inDungeon) {
            ctx.fillStyle = '#fd2';
            ctx.fillRect(30, 16, 3, 3);
            ctx.fillRect(31, 19, 1, 4);
            ctx.fillStyle = '#fff';
            this._drawText(ctx, 36, 17, 'x' + player.keys, 1);
        }

        // Boss key indicator
        if (player.hasBossKey) {
            ctx.fillStyle = '#f92';
            ctx.fillRect(54, 16, 4, 4);
            ctx.fillRect(55, 20, 2, 4);
        }

        // Minimap (center/right area)
        this._drawMinimap(ctx, 70, 18);

        // Location text
        ctx.fillStyle = '#aaa';
        const locName = this._getLocationName();
        this._drawText(ctx, 70, 4, locName, 1);
    },

    /** Draw minimap showing visited screens */
    _drawMinimap(ctx, mx, my) {
        const cellW = 6;
        const cellH = 4;

        if (World.inDungeon) {
            // Dungeon minimap
            const rooms = [
                [0, 1, '0,1'], [1, 0, '1,0'], [1, 1, '1,1'], [1, 2, '1,2'], [2, 1, '2,1']
            ];
            for (const [rx, ry, key] of rooms) {
                const px = mx + rx * (cellW + 1);
                const py = my + ry * (cellH + 1);
                const visited = World.visited[key];
                const current = World.screenX === parseInt(key[0]) && World.screenY === parseInt(key[2]);
                ctx.fillStyle = current ? '#6f6' : visited ? '#446' : '#222';
                ctx.fillRect(px, py, cellW, cellH);
            }
            return;
        }

        for (let sy = 0; sy < WORLD_H; sy++) {
            for (let sx = 0; sx < WORLD_W; sx++) {
                const key = sx + ',' + sy;
                const px = mx + sx * (cellW + 1);
                const py = my + sy * (cellH + 1);
                const visited = World.visited[key];
                const current = World.screenX === sx && World.screenY === sy;

                ctx.fillStyle = current ? '#6f6' : visited ? '#446' : '#222';
                ctx.fillRect(px, py, cellW, cellH);
            }
        }
    },

    /** Get location name for HUD */
    _getLocationName() {
        if (World.inDungeon) return 'DUNGEON 1';
        const names = {
            '0,0': 'MT. PEAK',
            '1,0': 'HIGHLANDS',
            '2,0': 'N. FOREST',
            '3,0': 'SACRED GROVE',
            '0,1': 'W. FOREST',
            '1,1': 'VILLAGE',
            '2,1': 'E. FIELD',
            '3,1': 'RIVERSIDE',
            '0,2': 'DUNGEON GATE',
            '1,2': 'S. CROSSROAD',
            '2,2': 'RUINS',
            '3,2': 'WATERFALL',
        };
        return names[World.screenX + ',' + World.screenY] || 'UNKNOWN';
    },

    // ===============================================================
    //  SCREENS (Title, Game Over, etc.)
    // ===============================================================

    drawTitleScreen(frame) {
        const ctx = this.ctx;
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Title: DELTA triangle logo
        const cx = CANVAS_W / 2;
        const cy = 70;
        ctx.fillStyle = '#fd2';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 30);
        ctx.lineTo(cx + 35, cy + 25);
        ctx.lineTo(cx - 35, cy + 25);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 16);
        ctx.lineTo(cx + 22, cy + 18);
        ctx.lineTo(cx - 22, cy + 18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fd2';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 6);
        ctx.lineTo(cx + 12, cy + 12);
        ctx.lineTo(cx - 12, cy + 12);
        ctx.closePath();
        ctx.fill();

        // Title text
        ctx.fillStyle = '#fd2';
        this._drawText(ctx, cx - 20, cy + 35, 'DELTA', 2);

        // Subtitle
        ctx.fillStyle = '#888';
        this._drawText(ctx, cx - 45, cy + 55, 'A World of Secrets', 1);

        // Start prompt (blink)
        if (Math.floor(frame / 30) % 2 === 0) {
            ctx.fillStyle = '#fff';
            this._drawText(ctx, cx - 40, cy + 90, 'Press ENTER', 1);
        }

        // Controls (centered vertically)
        ctx.fillStyle = '#666';
        const controlsY = cy + 110; // just below the start prompt
        this._drawText(ctx, cx - 60, controlsY, 'Arrows: Move', 1);
        this._drawText(ctx, cx - 60, controlsY + 14, 'Z/Space: Sword', 1);
        this._drawText(ctx, cx - 60, controlsY + 28, 'X: Use Item', 1);
    },

    drawGameOver(frame) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.fillStyle = '#f44';
        this._drawText(ctx, CANVAS_W / 2 - 30, 80, 'GAME OVER', 2);

        if (Math.floor(frame / 30) % 2 === 0) {
            ctx.fillStyle = '#fff';
            this._drawText(ctx, CANVAS_W / 2 - 40, 140, 'Press ENTER', 1);
        }
    },

    drawVictory(frame) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Victory triangle
        const cx = CANVAS_W / 2;
        ctx.fillStyle = '#fd2';
        ctx.beginPath();
        ctx.moveTo(cx, 40);
        ctx.lineTo(cx + 25, 80);
        ctx.lineTo(cx - 25, 80);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fd2';
        this._drawText(ctx, cx - 30, 95, 'VICTORY!', 2);

        ctx.fillStyle = '#aaa';
        this._drawText(ctx, cx - 65, 125, 'You discovered the', 1);
        this._drawText(ctx, cx - 60, 137, 'secret of Delta!', 1);

        ctx.fillStyle = '#888';
        this._drawText(ctx, cx - 30, 175, 'THE END', 1);

        if (Math.floor(frame / 30) % 2 === 0) {
            ctx.fillStyle = '#fff';
            this._drawText(ctx, cx - 40, 200, 'Press ENTER', 1);
        }
    },

    drawMessage(text) {
        const ctx = this.ctx;
        const lines = text.split('\n');
        const boxH = 20 + lines.length * 12;
        const boxW = 200; // slightly wider for longer messages
        const boxX = (CANVAS_W - boxW) / 2;
        // center vertically instead of bottom
        const boxY = (CANVAS_H - boxH) / 2;

        // Box
        ctx.fillStyle = '#111';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Text
        ctx.fillStyle = '#fff';
        for (let i = 0; i < lines.length; i++) {
            this._drawText(ctx, boxX + 8, boxY + 8 + i * 12, lines[i], 1);
        }

        // Continue prompt
        ctx.fillStyle = '#888';
        this._drawText(ctx, boxX + boxW - 30, boxY + boxH - 10, '[ Z ]', 1);
    },

    // ===============================================================
    //  TEXT RENDERING (simple pixel font)
    // ===============================================================

    /** Draw text using canvas fillText (larger monospace, with outline for legibility) */
    _drawText(ctx, x, y, text, scale) {
        ctx.save();
        const baseSize = 10; // Reduced for better balance at higher resolution
        ctx.font = (baseSize * (scale || 1)) + 'px monospace';
        ctx.textBaseline = 'top';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
        ctx.restore();
    },
};
