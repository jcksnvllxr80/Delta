/* ===================================================
   world.js - World map data, screen management
   =================================================== */

const World = {
    // Current position in the world grid
    screenX: 1,
    screenY: 1,
    inDungeon: false,
    dungeonRoom: null,

    // Live tile data for the current screen (mutable for destructibles)
    tiles: null,

    // Track visited screens for minimap
    visited: {},

    // Track permanently cleared rooms (dungeon)
    clearedRooms: {},

    // Track opened chests
    openedChests: {},

    // Track destroyed tiles
    destroyedTiles: {},

    // -------------------------------------------------------------------
    //  Overworld map data (4 wide x 3 tall)
    // -------------------------------------------------------------------
    overworldData: {},

    // -------------------------------------------------------------------
    //  Dungeon map data
    // -------------------------------------------------------------------
    dungeonData: {},

    /** Parse a string array into a 2D tile number array */
    _parse(rows) {
        return rows.map(row => {
            const tiles = [];
            for (let i = 0; i < COLS; i++) {
                const ch = i < row.length ? row[i] : '.';
                tiles.push(CHAR_MAP[ch] !== undefined ? CHAR_MAP[ch] : TL.GRASS);
            }
            return tiles;
        });
    },

    /** Initialize all map data */
    init() {
        this._buildOverworld();
        this._buildDungeon();
        this.loadScreen(this.screenX, this.screenY);
    },

    /** Load a screen's tile data (clone so originals are preserved) */
    loadScreen(sx, sy) {
        this.screenX = sx;
        this.screenY = sy;
        const key = sx + ',' + sy;
        this.visited[key] = true;

        let src;
        if (this.inDungeon) {
            src = this.dungeonData[key];
        } else {
            src = this.overworldData[key];
        }
        if (!src) {
            // Generate an empty screen if missing
            src = this._parse([
                'TTTTTTTTTTTTTTTT',
                'TTTTTTTTTTTTTTTT',
                'TTTTTTTTTTTTTTTT',
                'TTTTTTTTTTTTTTTT',
                'TTTTTTTTTTTTTTTT',
                'TTTTTTTTTTTTTTTT',
                'TTTTTTTTTTTTTTTT',
                'TTTTTTTTTTTTTTTT',
                'TTTTTTTTTTTTTTTT',
                'TTTTTTTTTTTTTTTT',
                'TTTTTTTTTTTTTTTT',
            ]);
        }
        // Deep clone
        this.tiles = src.map(row => [...row]);

        // Apply persistent tile changes (destroyed cracked walls etc.)
        const prefix = this.inDungeon ? 'd' : 'o';
        const dtKey = prefix + ':' + key;
        if (this.destroyedTiles[dtKey]) {
            for (const change of this.destroyedTiles[dtKey]) {
                this.tiles[change.r][change.c] = change.t;
            }
        }
        // Open chests that were already collected
        if (this.openedChests[dtKey]) {
            for (const pos of this.openedChests[dtKey]) {
                this.tiles[pos.r][pos.c] = this.inDungeon ? TL.FLOOR : TL.GRASS;
            }
        }
    },

    /** Get tile at grid position (bounds-checked) */
    getTile(col, row) {
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return TL.ROCK;
        return this.tiles[row][col];
    },

    /** Set tile (for destructibles, doors opening, etc.) */
    setTile(col, row, value) {
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
        this.tiles[row][col] = value;
    },

    /** Is tile solid? */
    isSolid(col, row) {
        return SOLID_TILES.has(this.getTile(col, row));
    },

    /** Check if a hitbox overlaps any solid tile */
    collides(x, y, w, h) {
        const l = Math.floor(x / TILE);
        const r = Math.floor((x + w - 1) / TILE);
        const t = Math.floor(y / TILE);
        const b = Math.floor((y + h - 1) / TILE);
        for (let row = t; row <= b; row++) {
            for (let col = l; col <= r; col++) {
                // Allow moving past screen edges for transitions
                if (col < 0 || col >= COLS || row < 0 || row >= ROWS) continue;
                if (this.isSolid(col, row)) return true;
            }
        }
        return false;
    },

    /** Persistently destroy a tile */
    destroyTile(col, row, newTile) {
        this.setTile(col, row, newTile);
        const prefix = this.inDungeon ? 'd' : 'o';
        const key = prefix + ':' + this.screenX + ',' + this.screenY;
        if (!this.destroyedTiles[key]) this.destroyedTiles[key] = [];
        this.destroyedTiles[key].push({ r: row, c: col, t: newTile });
    },

    /** Mark a chest as opened */
    markChestOpened(col, row) {
        const prefix = this.inDungeon ? 'd' : 'o';
        const key = prefix + ':' + this.screenX + ',' + this.screenY;
        if (!this.openedChests[key]) this.openedChests[key] = [];
        this.openedChests[key].push({ r: row, c: col });
        this.setTile(col, row, this.inDungeon ? TL.FLOOR : TL.GRASS);
    },

    // ===============================================================
    //  OVERWORLD SCREEN DEFINITIONS
    // ===============================================================
    _buildOverworld() {
        const p = this._parse.bind(this);

        // (0,0) Western Mountains - exits: S, E
        this.overworldData['0,0'] = p([
            '^^^^^^^^^^^^^^^^',
            '^^^...^^^^...^^^',
            '^^.............^',
            '^^..c..........^',
            '^^..............',
            '^^^.............',
            '^^..............',
            '^^^.........^^^^',
            '^^^^.......^^^^^',
            '^^^^^^^..^^^^^^^',
            '^^^^^^^..^^^^^^^',
        ]);

        // (1,0) Highland Path - exits: S, W, E
        this.overworldData['1,0'] = p([
            '^^^^^^^^^^^^^^^^',
            '^..............^',
            '^..............^',
            '^..............^',
            '................',
            '......====......',
            '................',
            '^..............^',
            '^.....^..^.....^',
            '^^^^^^^..^^^^^^^',
            '^^^^^^^..^^^^^^^',
        ]);

        // (2,0) Northern Forest - exits: S, W, E
        this.overworldData['2,0'] = p([
            'TTTTTTTTTTTTTTTT',
            'TT...TTTTT...TTT',
            'T..............T',
            'T..TT......TT..T',
            '..............x.',
            '..T...T..T....x.',
            '..............x.',
            'T..TT......TT..T',
            'T..............T',
            'TTTTTTT..TTTTTTT',
            'TTTTTTT..TTTTTTT',
        ]);

        // (3,0) Sacred Grove - exits: S, W(through cracked wall from 2,0)
        this.overworldData['3,0'] = p([
            'TTTTTTTTTTTTTTTT',
            'TT....TTTT....TT',
            'T..............T',
            'T.....TTTT.....T',
            '......T..T......',
            '......T.GT......',
            '......T..T......',
            'T.....TTTT.....T',
            'T..............T',
            'TTTTTTTTTTTTTTTT',
            'TTTTTTTTTTTTTTTT',
        ]);

        // (0,1) Western Forest - exits: N, E, S
        this.overworldData['0,1'] = p([
            'TTTTTTT..TTTTTTT',
            'TT.............T',
            'T..T..T........T',
            'T.....T...TT...T',
            'T..T............',
            'T...............',
            'T..T............',
            'T...TTT...T....T',
            'T..T..T........T',
            'TTTTTTT..TTTTTTT',
            'TTTTTTT..TTTTTTT',
        ]);

        // (1,1) Village (START) - exits: N, S, E, W
        this.overworldData['1,1'] = p([
            'TTTTTTT..TTTTTTT',
            'T..............T',
            'T..bbb....bb...T',
            'T..bcb....bb...T',
            '................',
            '......====......',
            '................',
            'T..bb.....bb...T',
            'T..bb.....bb...T',
            'T..............T',
            'TTTTTTT..TTTTTTT',
        ]);

        // (2,1) Eastern Field - exits: N, S, E, W
        this.overworldData['2,1'] = p([
            'TTTTTTT..TTTTTTT',
            'T..............T',
            'T..............T',
            'T....b....b....T',
            '................',
            '........b.......',
            '................',
            'T....b....b....T',
            'T..............T',
            'T..............T',
            'TTTTTTT..TTTTTTT',
        ]);

        // (3,1) Riverside - exits: N, S, W
        this.overworldData['3,1'] = p([
            'TTTTTTTTTTTTT~~T',
            'T..........T~~.T',
            'T..........~~~.T',
            'T..........~~..T',
            '...........~~..T',
            '..........~~~..T',
            '...........~~..T',
            'T..........~~..T',
            'T.........~~~..T',
            'T..TTTT..TT~~.TT',
            'TTTTTTT..TTT~~TT',
        ]);

        // (0,2) Dungeon Area - exits: N, E
        this.overworldData['0,2'] = p([
            'TTTTTTT..TTTTTTT',
            'TT.............T',
            'T..............T',
            'T..............T',
            'T.....d.........',
            'T...............',
            'T...............',
            'T..............T',
            'T..............T',
            'TT....TTTTTT..TT',
            'TTTTTTTTTTTTTTTT',
        ]);

        // (1,2) Southern Crossroad - exits: N, W, E
        this.overworldData['1,2'] = p([
            'TTTTTTT..TTTTTTT',
            'T..............T',
            'T..............T',
            'T..............T',
            '................',
            '......====......',
            '................',
            'T..............T',
            'T..............T',
            'TT............TT',
            'TTTTTTTTTTTTTTTT',
        ]);

        // (2,2) Eastern Ruins - exits: N, W, E
        this.overworldData['2,2'] = p([
            'TTTTTTT..TTTTTTT',
            'T..............T',
            'T...^^....^^...T',
            'T...^^....^^...T',
            '................',
            '....^^....^^....',
            '................',
            'T...^^.........T',
            'T..............T',
            'TT............TT',
            'TTTTTTTTTTTTTTTT',
        ]);

        // (3,2) Waterfall Shore - exits: N, W
        this.overworldData['3,2'] = p([
            'TTTTTTT..TTT~~TT',
            'T..........~~~.T',
            'T..........~~..T',
            'T.........~~~..T',
            '..........~~..TT',
            '..........~~..TT',
            '..........~~~..T',
            'T..........~~..T',
            'T..........~~~.T',
            'TT.........~~TTT',
            'TTTTTTTTTTTTTTTT',
        ]);
    },

    // ===============================================================
    //  DUNGEON ROOM DEFINITIONS
    // ===============================================================
    _buildDungeon() {
        const p = this._parse.bind(this);

        // Dungeon 1 layout (room grid):
        //            (1,0) Boss Room
        //  (0,1)West (1,1) Hub      (2,1) Item Room
        //            (1,2) Entry

        // (1,2) Entry Room - exits: N
        this.dungeonData['1,2'] = p([
            '#######  #######',
            '##            ##',
            '##            ##',
            '##            ##',
            '##            ##',
            '##            ##',
            '##            ##',
            '##            ##',
            '##            ##',
            '#######  #######',
            '#######ss#######',
        ]);

        // (1,1) Hub Room - exits: N(boss door), S, W, E(locked)
        this.dungeonData['1,1'] = p([
            '#######kk#######',
            '##            ##',
            '##            ##',
            '##   f    f   ##',
            'o              l',
            'o              l',
            'o              l',
            '##   f    f   ##',
            '##            ##',
            '##            ##',
            '#######  #######',
        ]);

        // (0,1) West Room - enemies, key drop. Exit: E
        this.dungeonData['0,1'] = p([
            '################',
            '################',
            '##            ##',
            '##  f      f  ##',
            '##             o',
            '##             o',
            '##             o',
            '##  f      f  ##',
            '##            ##',
            '################',
            '################',
        ]);

        // (2,1) Item Room - chest with bombs. Exit: W
        this.dungeonData['2,1'] = p([
            '################',
            '################',
            '##            ##',
            '##            ##',
            'o             ##',
            'o      $      ##',
            'o             ##',
            '##            ##',
            '##            ##',
            '################',
            '################',
        ]);

        // (1,0) Boss Room - exit: S
        this.dungeonData['1,0'] = p([
            '################',
            '################',
            '##            ##',
            '##            ##',
            '##            ##',
            '##            ##',
            '##            ##',
            '##            ##',
            '##            ##',
            '##            ##',
            '#######  #######',
        ]);
    },

    // ===============================================================
    //  Screen enemy spawn definitions
    // ===============================================================
    getEnemySpawns() {
        const key = this.screenX + ',' + this.screenY;

        if (this.inDungeon) {
            // Check if room was cleared already
            if (this.clearedRooms['d:' + key]) return [];

            const dungeonSpawns = {
                '0,1': [
                    { type: ENEMY.DARKNUT, x: 5 * TILE, y: 4 * TILE },
                    { type: ENEMY.DARKNUT, x: 10 * TILE, y: 6 * TILE },
                    { type: ENEMY.BAT,     x: 8 * TILE, y: 3 * TILE },
                ],
                '1,0': [
                    { type: ENEMY.BOSS, x: 7 * TILE, y: 4 * TILE },
                ],
                '1,1': [],
                '1,2': [],
                '2,1': [],
            };
            return dungeonSpawns[key] || [];
        }

        const overworldSpawns = {
            '0,0': [],
            '1,0': [
                { type: ENEMY.SLIME, x: 4 * TILE, y: 3 * TILE },
                { type: ENEMY.SLIME, x: 11 * TILE, y: 7 * TILE },
            ],
            '2,0': [
                { type: ENEMY.OCTOROK, x: 5 * TILE, y: 4 * TILE },
                { type: ENEMY.OCTOROK, x: 10 * TILE, y: 6 * TILE },
            ],
            '3,0': [],
            '0,1': [
                { type: ENEMY.SLIME, x: 6 * TILE, y: 3 * TILE },
                { type: ENEMY.BAT,   x: 10 * TILE, y: 5 * TILE },
            ],
            '1,1': [],  // Village is safe
            '2,1': [
                { type: ENEMY.SLIME,   x: 5 * TILE, y: 4 * TILE },
                { type: ENEMY.SLIME,   x: 10 * TILE, y: 7 * TILE },
                { type: ENEMY.OCTOROK, x: 8 * TILE, y: 5 * TILE },
            ],
            '3,1': [
                { type: ENEMY.OCTOROK, x: 4 * TILE, y: 5 * TILE },
            ],
            '0,2': [
                { type: ENEMY.SLIME, x: 10 * TILE, y: 3 * TILE },
                { type: ENEMY.BAT,   x: 8 * TILE, y: 7 * TILE },
            ],
            '1,2': [
                { type: ENEMY.SLIME, x: 5 * TILE, y: 5 * TILE },
                { type: ENEMY.SLIME, x: 11 * TILE, y: 5 * TILE },
            ],
            '2,2': [
                { type: ENEMY.OCTOROK, x: 7 * TILE, y: 4 * TILE },
                { type: ENEMY.DARKNUT, x: 10 * TILE, y: 6 * TILE },
            ],
            '3,2': [
                { type: ENEMY.OCTOROK, x: 4 * TILE, y: 4 * TILE },
            ],
        };
        return overworldSpawns[key] || [];
    },

    /** Get item pickups for current screen */
    getScreenItems() {
        const key = this.screenX + ',' + this.screenY;

        if (this.inDungeon) {
            const dungeonItems = {
                '2,1': [{ type: 'bombs', tileX: 7, tileY: 5 }],
            };
            return dungeonItems[key] || [];
        }

        const overworldItems = {
            '0,0': [{ type: 'heart_container', tileX: 4, tileY: 3 }],
        };
        return overworldItems[key] || [];
    },

    /** Enter dungeon from overworld */
    enterDungeon() {
        this.inDungeon = true;
        this.screenX = 1;
        this.screenY = 2;
        this.loadScreen(1, 2);
    },

    /** Exit dungeon to overworld */
    exitDungeon(overworldX, overworldY) {
        this.inDungeon = false;
        this.screenX = overworldX;
        this.screenY = overworldY;
        this.loadScreen(overworldX, overworldY);
    },
};
