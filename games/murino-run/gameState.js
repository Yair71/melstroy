import { STATE, CONFIG } from './config.js';

export const gameState = {
  current: STATE.LOADING,
  score: 0,
  coins: 0,
  speed: CONFIG.initialSpeed,

  // Player movement states
  isJumping: false,
  jumpTimer: 0, 
  currentLane: 1,
  targetX: CONFIG.lanes[1],

  // Timers
  deathTimer: 0,
  spawnTimer: 0,

  // НОВЫЕ СВОЙСТВА: Физика смерти (эффект камня)
  deathTargetY: 0,
  deathPushVelocity: 0,

  reset() {
    this.current = STATE.PLAYING;
    this.score = 0;
    this.coins = 0;
    this.speed = CONFIG.initialSpeed;

    this.isJumping = false;
    this.jumpTimer = 0;
    this.currentLane = 1;
    this.targetX = CONFIG.lanes[1];

    this.deathTimer = 0;
    this.spawnTimer = 0;

    this.deathTargetY = CONFIG.playerYOffset;
    this.deathPushVelocity = 0;
  }
};
