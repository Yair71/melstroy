import { STATE, PHASE, CONFIG } from './config.js';
 
export const gameState = {
    current: STATE.LOADING,
    phase: PHASE.AIM_X,
      // Hand position
    handX: CONFIG.handStartX,
    handY: CONFIG.handStartY,
    handZ: CONFIG.handStartZ,
    
    // Oscillation direction
    dirX: 1,
    dirY: 1,
     // Is user holding spacebar/touch
    isHolding: false,
 
    reset() {
        this.current = STATE.PLAYING;
        this.phase = PHASE.AIM_X;
        this.dirX = 1;
        this.dirY = 1;
        this.handZ = CONFIG.handStartZ;
        this.dirX = 1;
        this.dirY = 1;
        this.isHolding = false;
    }
};
