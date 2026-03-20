import { STATE, PHASE, CONFIG } from './config.js';

export const gameState = {
    current: STATE.LOADING,
    phase: PHASE.AIM_X,
    
    // Позиция руки
    handX: CONFIG.handStartX,
    handY: CONFIG.handStartY,
    handZ: CONFIG.handStartZ,
    
    // Направление движения для осцилляции (туда-сюда)
    dirX: 1,
    dirY: 1,
    
    reset() {
        this.current = STATE.PLAYING;
        this.phase = PHASE.AIM_X;
        this.handX = CONFIG.handStartX;
        this.handY = CONFIG.handStartY;
        this.handZ = CONFIG.handStartZ;
        this.dirX = 1;
        this.dirY = 1;
    }
};
