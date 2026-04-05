// ============================================================
// gameState.js — Runtime state (v6)
// ============================================================
import { STATE, MODE, CONFIG } from './config.js';

export const gameState = {
    current: STATE.LOADING,
    mode: null,

    playerX: 0,
    playerScale: 1.0,

    currentLanes: CONFIG.baseLanes,
    worldWidth: CONFIG.canvasWidth,
    cameraZoom: 1.0,

    score: 0,
    coins: 0,         // Сбор монет
    coinsSaved: false,// Флаг отправки монет на аккаунт
    killedByBomb: false,

    combo: 0,
    maxCombo: 0,

    missed: 0,
    strikes: 0,

    elapsed: 0,
    spawnTimer: 0,
    currentSpawnInterval: CONFIG.itemSpawnInterval,
    currentFallSpeed: CONFIG.itemFallSpeed,

    moveLeft: false,
    moveRight: false,
    touchActive: false,
    touchX: null,

    items: [],
    particles: [],

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
        this.coins = 0;
        this.coinsSaved = false;
        this.killedByBomb = false;
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

export function getWeightKg() {
    const base = gameState.mode === MODE.OBESITY ? CONFIG.baseWeightObesity : CONFIG.baseWeightFit;
    return Math.floor(base + (gameState.playerScale - 1) * CONFIG.kgPerScale);
}

export function getWeightGainKg() {
    return Math.max(0, Math.floor((gameState.playerScale - 1) * CONFIG.kgPerScale));
}
