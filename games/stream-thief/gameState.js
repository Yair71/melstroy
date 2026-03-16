// games/stream-thief/gameState.js
import { STATE, STREAMER_STATE, CONFIG } from './config.js';

export const gameState = {
    current: STATE.LOADING,
    score: 0,
    coins: 0, // Можно использовать как донатную валюту
    
    // Состояние игрока (Руки)
    isHolding: false,        // Зажат ли пробел/экран
    handProgressZ: CONFIG.handBaseZ, // Текущая позиция вытянутой руки
    
    // Состояние стримера (Мела)
    streamerState: STREAMER_STATE.SLEEPING,
    streamerTimer: 0,        // Таймер до смены фазы
    
    reset() {
        this.current = STATE.PLAYING;
        this.score = 0;
        this.coins = 0;
        
        this.isHolding = false;
        this.handProgressZ = CONFIG.handBaseZ;
        
        this.streamerState = STREAMER_STATE.SLEEPING;
        this.streamerTimer = 3.0; // Даем 3 секунды форы на старте
    }
};
