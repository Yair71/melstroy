// ============================================================
// gameState.js — Runtime state (v3) — dynamic lanes + zoom
// ============================================================
import { STATE, MODE, CONFIG } from './config.js';

export const gameState = {
    current: STATE.LOADING,
    mode: null,

    // Player
    playerX: 0,
    playerScale: 1.0,

    // Dynamic world
    currentLanes: CONFIG.baseLanes,
    worldWidth: CONFIG.canvasWidth,    // logical play area width (grows)
    cameraZoom: 1.0,                   // <1 = zoomed out to see more

    // Score
    score: 0,
    combo: 0,
    maxCombo: 0,

    // Obesity mode
    missed: 0,

    // Fit mode
    strikes: 0,

    // Timing
    elapsed: 0,
    spawnTimer: 0,
    currentSpawnInterval: CONFIG.itemSpawnInterval,
    currentFallSpeed: CONFIG.itemFallSpeed,

    // Input
    moveLeft: false,
    moveRight: false,
    touchActive: false,
    touchX: null,

    // Items in play
    items: [],

    // Particles
    particles: [],

    // Screen shake
    shakeTimer: 0,
    shakeIntensity: 0,

    reset(mode) {
        this.current = STATE.PLAYING;
        this.mode = mode;
        this.playerX = CONFIG.canvasWidth / 2;
        this.playerScale = 1.0;
        this.currentLanes = CONFIG.baseLanes;
        this.worldWidth = CONFIG.canvasWidth;
        this.cameraZoom = 1.0;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.missed = 0;
        this.strikes = 0;
        this.elapsed = 0;
        this.spawnTimer = 0;
        this.currentSpawnInterval = CONFIG.itemSpawnInterval;
        this.currentFallSpeed = CONFIG.itemFallSpeed;
        this.moveLeft = false;
        this.moveRight = false;
        this.touchActive = false;
        this.touchX = null;
        this.items = [];
        this.particles = [];
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
    }
};

// Helper: get current weight in kg
export function getWeightKg() {
    return Math.floor(CONFIG.baseWeight + (gameState.playerScale - 1) * CONFIG.kgPerScale);
}

// Helper: get weight gained above base
export function getWeightGainKg() {
    return Math.max(0, Math.floor((gameState.playerScale - 1) * CONFIG.kgPerScale));
}
