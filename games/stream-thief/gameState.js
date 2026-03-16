// games/stream-thief/gameState.js
import { STATE, STREAMER_STATE, CONFIG } from './config.js';

export const THIEF_PHASE = {
    AIM_X: 'AIM_X',
    AIM_Y: 'AIM_Y',
    STEAL_Z: 'STEAL_Z',
    RETURNING: 'RETURNING' // Когда успешно украл и рука сама едет назад
};

export const gameState = {
    current: STATE.LOADING,
    score: 0,
    coins: 0,
    
    // Состояние игрока (Руки)
    thiefPhase: THIEF_PHASE.AIM_X,
    isHolding: false,        
    
    // Координаты руки
    handX: 0,
    handY: 2,
    handZ: CONFIG.handBaseZ, 
    
    // Направления для авто-движения прицела
    aimDirX: 1, 
    aimDirY: 1,
    
    // Состояние стримера (Мела)
    streamerState: STREAMER_STATE.SLEEPING,
    streamerTimer: 0,        
    
    reset() {
        this.current = STATE.PLAYING;
        this.score = 0;
        this.coins = 0;
        
        this.thiefPhase = THIEF_PHASE.AIM_X;
        this.isHolding = false;
        
        this.handX = 0;
        this.handY = 4; // Начинаем повыше
        this.handZ = CONFIG.handBaseZ;
        
        this.aimDirX = 1;
        this.aimDirY = 1;
        
        this.streamerState = STREAMER_STATE.SLEEPING;
        this.streamerTimer = 3.0; 
    }
};
