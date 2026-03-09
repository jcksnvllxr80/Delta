/* ===================================================
   main.js - Game initialization, loop, state machine
   =================================================== */

const Game = {
    state: STATE.TITLE,
    frame: 0,

    // Screen transition state
    transition: {
        dir: null,
        progress: 0,
        oldTiles: null,
        newScreenX: 0,
        newScreenY: 0,
        playerNewX: 0,
        playerNewY: 0,
    },

    // Message box state
    messageText: '',

    // Dungeon entrance coordinates (to return to on exit)
    dungeonOverworldX: 0,
    dungeonOverworldY: 2,

    /** Initialize the game */
    init() {
        Renderer.init();
        Input.init();
        World.init();
    },

    /** Start a new game */
    startNewGame() {
        World.screenX = 1;
        World.screenY = 1;
        World.inDungeon = false;
        World.visited = {};
        World.clearedRooms = {};
        World.openedChests = {};
        World.destroyedTiles = {};

        Player.init();
        Player.hp = Player.maxHp;
        Player.hasBombs = false;
        Player.hasBossKey = false;
        Player.keys = 0;
        Player.bombCount = 0;

        World.loadScreen(1, 1);
        Enemies.spawnForScreen();
        Items.reset();
        Items.loadScreenItems();

        // start overworld music (user interaction may be required in some browsers)
        if (window.Music) {
            Music.play('overworld').catch(() => {});
        }

        this.state = STATE.PLAYING;
    },

    /** Show a message to the player */
    showMessage(text) {
        this.messageText = text;
        this.state = STATE.MESSAGE;
    },

    // ===============================================================
    //  MAIN GAME LOOP
    // ===============================================================

    /** Called every frame */
    loop() {
        this.frame++;

        switch (this.state) {
            case STATE.TITLE:
                this._updateTitle();
                break;
            case STATE.PLAYING:
                this._updatePlaying();
                break;
            case STATE.TRANSITION:
                this._updateTransition();
                break;
            case STATE.DUNGEON_ENTER:
                this._updateDungeonEnter();
                break;
            case STATE.DUNGEON_EXIT:
                this._updateDungeonExit();
                break;
            case STATE.MESSAGE:
                this._updateMessage();
                break;
            case STATE.GAME_OVER:
                this._updateGameOver();
                break;
            case STATE.VICTORY:
                this._updateVictory();
                break;
        }

        Input.update();
        requestAnimationFrame(() => this.loop());
    },

    // ===============================================================
    //  STATE UPDATES
    // ===============================================================

    _updateTitle() {
        Renderer.drawTitleScreen(this.frame);
        // play title music if not already active
        if (window.Music && Music.current !== 'title') {
            Music.play('title').catch(() => {});
        }
        if ((Input.isPressed('Enter') || Input.isPressed('KeyZ') || Input.isPressed('Space')) && window.Music) {
            // start game (music already playing)
            this.startNewGame();
        }
    },

    _updatePlaying() {
        // Player update
        const transition = Player.update();

        // Check tile interactions (dungeon entrance, cave, goal)
        const interaction = Player.checkTileInteraction();
        if (interaction === 'enter_dungeon') {
            this._enterDungeon();
            return;
        }
        if (interaction === 'exit_dungeon') {
            this._exitDungeon();
            return;
        }
        if (interaction === 'cave_interact' &&
            (Input.isPressed('KeyZ') || Input.isPressed('Space') || Input.isPressed('Enter'))) {
            this._handleCave();
        }
        if (interaction === 'victory') {
            this.state = STATE.VICTORY;
            this.frame = 0;
            return;
        }

        // Screen transition check
        if (transition) {
            this._startTransition(transition);
            return;
        }

        // Enemy update
        Enemies.update(Player.x + 8, Player.y + 8);

        // Items update
        Items.update();

        // Player damage from enemies
        if (Player.invulnTimer <= 0 && Player.hurtTimer <= 0 && Player.attackTimer <= 0) {
            const enemy = Enemies.checkContact(
                Player.x + Player.hbOx,
                Player.y + Player.hbOy,
                Player.hbW,
                Player.hbH
            );
            if (enemy) {
                // Determine direction to knock player
                const dx = Player.x - enemy.x;
                const dy = Player.y - enemy.y;
                let knockDir;
                if (Math.abs(dx) > Math.abs(dy)) {
                    knockDir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
                } else {
                    knockDir = dy > 0 ? DIR.DOWN : DIR.UP;
                }
                Player.takeDamage(1, knockDir);
            }
        }

        // Player damage from enemy projectiles
        if (Player.invulnTimer <= 0 && Player.hurtTimer <= 0) {
            if (Items.checkProjectileHit(
                Player.x + Player.hbOx,
                Player.y + Player.hbOy,
                Player.hbW, Player.hbH,
                true  // from enemy
            )) {
                Player.takeDamage(1, Player.dir);
            }
        }

        // Bomb damage to enemies
        for (const enemy of Enemies.list) {
            if (!enemy.active || enemy.hurtTimer > 0) continue;
            if (Items.checkBombHit(enemy.x, enemy.y, enemy.w, enemy.h)) {
                Enemies.damage(enemy, 3, Player.dir);
            }
        }

        // Item pickups
        const pickup = Items.checkPlayerPickup(Player);
        if (pickup) {
            Player.collectPickup(pickup);
            if (window.SFX) SFX.play('pickup');
        }

        // Check player death
        if (Player.hp <= 0) {
            this.state = STATE.GAME_OVER;
            this.frame = 0;
            return;
        }

        // Render
        this._renderGame();
    },

    _updateTransition() {
        const t = this.transition;
        t.progress += TRANS_SPEED;

        const totalDist = (t.dir === DIR.LEFT || t.dir === DIR.RIGHT) ? GAME_W : GAME_H;

        if (t.progress >= totalDist) {
            // Transition complete
            World.loadScreen(t.newScreenX, t.newScreenY);
            Player.x = t.playerNewX;
            Player.y = t.playerNewY;
            Enemies.spawnForScreen();
            Items.reset();
            Items.loadScreenItems();
            this.state = STATE.PLAYING;
            this._renderGame();
            return;
        }

        // Render sliding screens
        Renderer.clear();

        let oldOx = 0, oldOy = 0, newOx = 0, newOy = 0;
        switch (t.dir) {
            case DIR.LEFT:
                oldOx = t.progress;
                newOx = -GAME_W + t.progress;
                break;
            case DIR.RIGHT:
                oldOx = -t.progress;
                newOx = GAME_W - t.progress;
                break;
            case DIR.UP:
                oldOy = t.progress;
                newOy = -GAME_H + t.progress;
                break;
            case DIR.DOWN:
                oldOy = -t.progress;
                newOy = GAME_H - t.progress;
                break;
        }

        Renderer.drawTiles(t.oldTiles, oldOx, oldOy);

        // Load new screen tiles temporarily for drawing
        const savedTiles = World.tiles;
        World.loadScreen(t.newScreenX, t.newScreenY);
        Renderer.drawTiles(World.tiles, newOx, newOy);
        World.tiles = savedTiles;
        World.screenX = t.oldScreenX;
        World.screenY = t.oldScreenY;

        Renderer.drawHUD(Player);
    },

    _updateDungeonEnter() {
        // Simple fade transition for dungeon entry
        this.transition.progress += 4;
        if (this.transition.progress >= 60) {
            World.enterDungeon();
            Player.x = 7 * TILE;
            Player.y = 9 * TILE;
            Player.dir = DIR.UP;
            Enemies.spawnForScreen();
            Items.reset();
            Items.loadScreenItems();
            this.state = STATE.PLAYING;
            return;
        }

        this._renderGame();
        const alpha = Math.min(1, this.transition.progress / 30);
        Renderer.ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        Renderer.ctx.fillRect(0, HUD_H, GAME_W, GAME_H);
    },

    _updateDungeonExit() {
        this.transition.progress += 4;
        if (this.transition.progress >= 60) {
            World.exitDungeon(this.dungeonOverworldX, this.dungeonOverworldY);
            Player.x = 5 * TILE;
            Player.y = 5 * TILE;
            Player.dir = DIR.DOWN;
            Enemies.spawnForScreen();
            Items.reset();
            Items.loadScreenItems();
            this.state = STATE.PLAYING;
            return;
        }

        this._renderGame();
        const alpha = Math.min(1, this.transition.progress / 30);
        Renderer.ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        Renderer.ctx.fillRect(0, HUD_H, GAME_W, GAME_H);
    },

    _updateMessage() {
        this._renderGame();
        Renderer.drawMessage(this.messageText);

        if (Input.isPressed('KeyZ') || Input.isPressed('Space') || Input.isPressed('Enter')) {
            this.state = STATE.PLAYING;
        }
    },

    _updateGameOver() {
        Renderer.drawGameOver(this.frame);
        if (Input.isPressed('Enter') || Input.isPressed('KeyZ')) {
            this.state = STATE.TITLE;
            this.frame = 0;
        }
    },

    _updateVictory() {
        Renderer.drawVictory(this.frame);
        if (Input.isPressed('Enter') || Input.isPressed('KeyZ')) {
            this.state = STATE.TITLE;
            this.frame = 0;
        }
    },

    // ===============================================================
    //  HELPERS
    // ===============================================================

    _renderGame() {
        Renderer.clear();
        Renderer.drawTiles(World.tiles, 0, 0);
        Renderer.drawPickups();
        Renderer.drawBombs();
        Renderer.drawProjectiles();

        // Draw enemies
        for (const e of Enemies.list) {
            if (e.active) Renderer.drawEnemy(e);
        }

        // Draw player
        Renderer.drawPlayer(Player);

        // Draw HUD
        Renderer.drawHUD(Player);
    },

    _startTransition(t) {
        this.transition.dir = t.dir;
        this.transition.progress = 0;
        this.transition.oldTiles = World.tiles.map(r => [...r]);
        this.transition.oldScreenX = World.screenX;
        this.transition.oldScreenY = World.screenY;

        // Calculate new screen coords
        let nx = World.screenX;
        let ny = World.screenY;
        switch (t.dir) {
            case DIR.LEFT:  nx--; break;
            case DIR.RIGHT: nx++; break;
            case DIR.UP:    ny--; break;
            case DIR.DOWN:  ny++; break;
        }

        // Bounds check
        const maxX = World.inDungeon ? 2 : WORLD_W - 1;
        const maxY = World.inDungeon ? 2 : WORLD_H - 1;
        if (nx < 0 || nx > maxX || ny < 0 || ny > maxY) {
            // Prevent going off-map
            Player.x = Math.max(0, Math.min(GAME_W - TILE, Player.x));
            Player.y = Math.max(0, Math.min(GAME_H - TILE, Player.y));
            this.state = STATE.PLAYING;
            return;
        }

        // Check if the target screen exists
        const key = nx + ',' + ny;
        const screenData = World.inDungeon ? World.dungeonData[key] : World.overworldData[key];
        if (!screenData) {
            Player.x = Math.max(0, Math.min(GAME_W - TILE, Player.x));
            Player.y = Math.max(0, Math.min(GAME_H - TILE, Player.y));
            this.state = STATE.PLAYING;
            return;
        }

        this.transition.newScreenX = nx;
        this.transition.newScreenY = ny;
        this.transition.playerNewX = t.nx;
        this.transition.playerNewY = t.ny;

        this.state = STATE.TRANSITION;
    },

    _enterDungeon() {
        this.dungeonOverworldX = World.screenX;
        this.dungeonOverworldY = World.screenY;
        Player.savedOverworldX = Player.x;
        Player.savedOverworldY = Player.y;
        this.transition.progress = 0;
        this.state = STATE.DUNGEON_ENTER;
        if (window.Music) Music.play('dungeon').catch(() => {});
    },

    _exitDungeon() {
        this.transition.progress = 0;
        this.state = STATE.DUNGEON_EXIT;
        if (window.Music) Music.play('overworld').catch(() => {});
    },

    _handleCave() {
        const key = World.screenX + ',' + World.screenY;
        // Village cave (1,1) - give sword once
        if (key === '1,1') {
            if (!Player.hasSword) {
                Player.hasSword = true;
                this.showMessage('You found a sword!\nUse it to fight enemies.');
            } else {
                this.showMessage('The cave is empty.');
            }
        }
        // Mountain cave (0,0) - gives heart container
        else if (key === '0,0') {
            const chestKey = 'o:' + key;
            if (!World.openedChests[chestKey + ':cave']) {
                World.openedChests[chestKey + ':cave'] = true;
                Player.maxHp += 2;
                Player.hp = Player.maxHp;
                this.showMessage('Heart Container!\nHP increased!');
            } else {
                this.showMessage('The cave is empty.');
            }
        }
        else {
            this.showMessage('A mysterious\ncave...');
        }
    },
};

// ===============================================================
//  BOOTSTRAP
// ===============================================================
window.addEventListener('load', () => {
    Game.init();
    Game.loop();
});
