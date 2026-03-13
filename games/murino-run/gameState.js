import { STATE, CONFIG } from './config.js';

// Centralized state object
export const gameState = {
    current: STATE.LOADING,
    score: 0,
    coins: 0,
    speed: CONFIG.initialSpeed,
    
    // Player movement states
    isJumping: false,
    velocityY: 0,
    currentLane: 1, // 0 = Left, 1 = Center, 2 = Right
    targetX: CONFIG.lanes[1],
    
    // Timers
    deathTimer: 0,
    spawnTimer: 0,

    // Reset function for "Play Again"
    reset() {
        this.current = STATE.PLAYING;
        this.score = 0;
        this.coins = 0;
        this.speed = CONFIG.initialSpeed;
        
        this.isJumping = false;
        this.velocityY = 0;
        this.currentLane = 1;
        this.targetX = CONFIG.lanes[1];
        
        this.deathTimer = 0;
        this.spawnTimer = 0;
    }
};
