import { STATE, PHASE, CONFIG } from './config.js';
export const gameState = {
    current: STATE.LOADING, phase: PHASE.AIM_X,
    handX: CONFIG.handStartX, handY: CONFIG.handStartY, handZ: CONFIG.handStartZ,
    dirX: 1, dirY: 1, isHolding: false, lootCollected: 0, totalLoot: CONFIG.lootPositions.length,
    reset() {
        this.current = STATE.PLAYING; this.phase = PHASE.AIM_X;
        this.handX = CONFIG.handStartX; this.handY = CONFIG.handStartY; this.handZ = CONFIG.handStartZ;
        this.dirX = 1; this.dirY = 1; this.isHolding = false; this.lootCollected = 0;
    }
};
