# DELTA

A Zelda-like HTML5 adventure game with proper separation of concerns across 10 files:

## File Structure

```
game/
├── index.html          - Entry point, loads all scripts
├── css/style.css       - Canvas styling, pixel-perfect rendering
└── js/
    ├── config.js       - Constants, tile types, colors, enums
    ├── input.js        - Keyboard input (arrows/WASD, Z, X)
    ├── world.js        - 12 overworld screens + 5 dungeon rooms
    ├── player.js       - Movement, combat, inventory, interactions
    ├── enemies.js      - 5 enemy types with AI behaviors
    ├── items.js        - Pickups, bombs, projectiles
    ├── renderer.js     - All canvas drawing (tiles, sprites, HUD)
    └── main.js         - Game loop, state machine, transitions
```

## Gameplay Features

- **12 overworld screens** across mountains, forests, village, riverside, ruins, and a sacred grove
- **1 complete dungeon** (5 rooms) with enemies, a key puzzle, a locked item room, and a boss fight
- **Real-time combat** - sword attacks (Z/Space), bombs (X) as secondary item
- **Background music** that changes with the title screen, overworld, and dungeon
- **Sound effects** for sword swings and item pickups (customizable via `game/sfx/`)
- **Screen transitions** with Zelda-style sliding animation
- **4 enemy types** + 1 boss: Slime, Octorok (shoots projectiles), Bat, Darknut (chases), and a dragon boss
- **Progression loop**: Explore overworld → Find dungeon → Get bombs → Defeat boss → Use bombs on cracked walls → Reach the Sacred Grove (victory)
- **HUD** with hearts, bomb count, key count, minimap
- **Title screen, game over, and victory states**

## Controls

- **Arrow keys / WASD** - Move
- **Z / Space** - Sword attack (also interacts with chests, doors)
- **X** - Place bomb (after finding them in the dungeon)
- **Enter** - Start / confirm

## How to Play Locally

To play Delta in your browser, you need to serve the files using a local web server. The easiest way is with Python:

> Music starts automatically when the game begins. Tracks will switch based on where you are (title/overworld/dungeon); mute the browser tab if you prefer silence.
>
> **Custom music:** put `intro.mp3`, `overworld.mp3`, and `dungeon.mp3` into the `game/music/` folder and they will be loaded automatically. You can also use OGG files if you modify `music.js` accordingly.
>
> **Sound effects:** drop `sword.mp3` and `pickup.mp3` into `game/sfx/`; the engine plays them when you attack or pick up items.

1. Open a terminal and navigate to the `game` directory:

```sh
cd game
```

2. Start a simple HTTP server (requires Python 3):

```sh
python -m http.server 8080
```

3. Open your browser and go to [http://localhost:8080](http://localhost:8080)

This will let you play the game with all features working as intended.

## How to Stop the Server

To stop the Python HTTP server:

1. If you can see the terminal where the server is running, press **Ctrl+C** to stop it.

2. If you can't find the terminal:
- Open a new terminal and run:

    ```sh
    netstat -ano | findstr :8080
    ```

This will show the process ID (PID) using port 8080.
- Then run:

    ```sh
    taskkill /PID <PID> /F
    ```

- Replace `<PID>` with the number you found in the previous step.

This will force-stop the server running on port 8080.
