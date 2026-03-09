/* ===================================================
   config.js - Game constants, tile definitions, colors
   =================================================== */

// ---- Display ----
const TILE = 32;
const COLS = 16;
const ROWS = 11;
const HUD_H = 48;
const GAME_W = TILE * COLS;       // 256
const GAME_H = TILE * ROWS;      // 176
const CANVAS_W = GAME_W;          // 256
const CANVAS_H = GAME_H + HUD_H; // 224
const DISPLAY_SCALE = 3;

// ---- World grid ----
const WORLD_W = 4;
const WORLD_H = 3;

// ---- Player ----
const PLAYER_SPEED = 0.4;
const PLAYER_MAX_HP = 6;
const ATTACK_DURATION = 12;
const INVULN_TIME = 60;
const KNOCKBACK_SPEED = 2.5;
const KNOCKBACK_FRAMES = 10;

// ---- Transition ----
const TRANS_SPEED = 6;

// ---- Directions ----
const DIR = { UP: 0, DOWN: 1, LEFT: 2, RIGHT: 3 };

// ---- Game states ----
const STATE = {
    TITLE: 'title',
    PLAYING: 'playing',
    TRANSITION: 'transition',
    DUNGEON_ENTER: 'dungeon_enter',
    DUNGEON_EXIT: 'dungeon_exit',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    VICTORY: 'victory',
    MESSAGE: 'message',
};

// ---- Tile types ----
const TL = {
    GRASS:  0,
    TREE:   1,
    WATER:  2,
    ROCK:   3,
    SAND:   4,
    PATH:   5,
    CAVE:   6,
    DUNGEON:7,
    CRACKED:8,
    BUSH:   9,
    BRIDGE: 10,
    WALL:   11,
    FLOOR:  12,
    DOOR_LOCKED: 13,
    DOOR:   14,
    STAIRS: 15,
    CHEST:  16,
    GOAL:   17,
    BOSS_DOOR: 18,
    FLOOR_ALT: 19,
};

// ---- Character-to-tile mapping for map strings ----
const CHAR_MAP = {
    '.': TL.GRASS,
    'T': TL.TREE,
    '~': TL.WATER,
    '^': TL.ROCK,
    ',': TL.SAND,
    '=': TL.PATH,
    'c': TL.CAVE,
    'd': TL.DUNGEON,
    'x': TL.CRACKED,
    'b': TL.BUSH,
    '_': TL.BRIDGE,
    '#': TL.WALL,
    ' ': TL.FLOOR,
    'l': TL.DOOR_LOCKED,
    'o': TL.DOOR,
    's': TL.STAIRS,
    '$': TL.CHEST,
    'G': TL.GOAL,
    'k': TL.BOSS_DOOR,
    'f': TL.FLOOR_ALT,
};

// ---- Which tiles are solid (block movement) ----
const SOLID_TILES = new Set([
    TL.TREE, TL.WATER, TL.ROCK, TL.CRACKED,
    TL.WALL, TL.DOOR_LOCKED, TL.BOSS_DOOR, TL.CHEST,
]);

// ---- Tile colors ----
const TILE_COLORS = {
    [TL.GRASS]:     '#4a4',
    [TL.TREE]:      '#263',
    [TL.WATER]:     '#26c',
    [TL.ROCK]:      '#665',
    [TL.SAND]:      '#ca6',
    [TL.PATH]:      '#a85',
    [TL.CAVE]:      '#222',
    [TL.DUNGEON]:   '#534',
    [TL.CRACKED]:   '#776',
    [TL.BUSH]:      '#3a4',
    [TL.BRIDGE]:    '#863',
    [TL.WALL]:      '#335',
    [TL.FLOOR]:     '#557',
    [TL.DOOR_LOCKED]:'#a72',
    [TL.DOOR]:      '#557',
    [TL.STAIRS]:    '#779',
    [TL.CHEST]:     '#da2',
    [TL.GOAL]:      '#fd2',
    [TL.BOSS_DOOR]: '#a23',
    [TL.FLOOR_ALT]: '#668',
};

// ---- Tile detail colors (for rendering detail) ----
const TILE_DETAIL = {
    [TL.TREE]:   '#1a4',
    [TL.WATER]:  '#38e',
    [TL.ROCK]:   '#554',
    [TL.BUSH]:   '#2b3',
    [TL.WALL]:   '#224',
    [TL.CHEST]:  '#b80',
    [TL.CRACKED]:'#665',
    [TL.GOAL]:   '#fe4',
};

// ---- Enemy types ----
const ENEMY = {
    SLIME:   'slime',
    OCTOROK: 'octorok',
    BAT:     'bat',
    DARKNUT: 'darknut',
    BOSS:    'boss',
};
