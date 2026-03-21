// ============================================================
// gameState.js — Runtime state, single source of truth
// ============================================================
import { STATE, PHASE, CONFIG } from './config.js';

export const gameState = {
    current: STATE.LOADING,
    phase:   PHASE.AIM_X,

    // Hand position — starts at the exact coordinates you found
    handX: CONFIG.handStartX,
    handY: CONFIG.handStartY,
    handZ: CONFIG.handStartZ,

    // Oscillation directions
    dirX: 1,
    dirY: 1,

    // Is user holding tap/space
    isHolding: false,

    // Loot tracking
    lootCollected: 0,
    totalLoot: 0,

    reset() {
        this.current = STATE.PLAYING;
        this.phase   = PHASE.AIM_X;

        this.handX = CONFIG.handStartX;
        this.handY = CONFIG.handStartY;
        this.handZ = CONFIG.handStartZ;

        this.dirX = 1;
        this.dirY = 1;
        this.isHolding = false;
        this.lootCollected = 0;
    }
};
