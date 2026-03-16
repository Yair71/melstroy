// games/stream-thief/gameState.js
import { STATE, STREAMER_STATE, CONFIG } from './config.js';

export const THIEF_PHASE = {
    AIM_X: 'AIM_X',
    AIM_Y: 'AIM_Y',
    READY_Z: 'READY_Z',    // НОВОЕ: Рука зафиксирована и ждет зажатия пробела
    STEAL_Z: 'STEAL_Z',
    RETURNING: 'RETURNING' 
};

export const gameState = {
    current: STATE.LOADING,
    score: 0,
    coins: 0,
    
    thiefPhase: THIEF_PHASE.AIM_X,
    isHolding: false,        
    
    handX: 0,
    handY: 4,
    handZ: CONFIG.handBaseZ, 
    
    aimDirX: 1, 
    aimDirY: 1,
    
    streamerState: STREAMER_STATE.SLEEPING,
    streamerTimer: 0,        
    
    reset() {
        this.current = STATE.PLAYING;
        this.score = 0;
        this.coins = 0;
        
        this.thiefPhase = THIEF_PHASE.AIM_X;
        this.isHolding = false;
        
        this.handX = 0;
        this.handY = 4; 
        this.handZ = CONFIG.handBaseZ;
        
        this.aimDirX = 1;
        this.aimDirY = 1;
        
        this.streamerState = STREAMER_STATE.SLEEPING;
        this.streamerTimer = 3.0; 
    }
};
