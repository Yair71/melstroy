// games/stream-thief/input.js
import { STATE } from './config.js';
import { gameState, THIEF_PHASE } from './gameState.js';

let inputListenersBound = false;

export function initInput() {
    if (inputListenersBound) return;

    const handleDown = (e) => {
        if (e.code === 'Space' || e.type === 'touchstart') {
            if (e.code === 'Space') e.preventDefault();

            if (gameState.current === STATE.INTRO) {
                gameState.current = STATE.PLAYING;
            } else if (gameState.current === STATE.PLAYING) {
                
                // Логика фаз клешни
                if (gameState.thiefPhase === THIEF_PHASE.AIM_X) {
                    gameState.thiefPhase = THIEF_PHASE.AIM_Y; // Фиксируем X, начинаем Y
                } 
                else if (gameState.thiefPhase === THIEF_PHASE.AIM_Y) {
                    gameState.thiefPhase = THIEF_PHASE.STEAL_Z; // Фиксируем Y, переходим к стелсу
                    gameState.isHolding = true; // Сразу начинаем тянуть
                }
                else if (gameState.thiefPhase === THIEF_PHASE.STEAL_Z) {
                    gameState.isHolding = true; // Зажимаем для кражи (Murder стайл)
                }
            }
        }
    };

    const handleUp = (e) => {
        if (e.code === 'Space' || e.type === 'touchend' || e.type === 'touchcancel') {
            if (e.code === 'Space') e.preventDefault();
            
            if (gameState.thiefPhase === THIEF_PHASE.STEAL_Z) {
                gameState.isHolding = false; // Отпустили - рука прячется
            }
        }
    };

    window.addEventListener('keydown', handleDown, { passive: false });
    window.addEventListener('keyup', handleUp);
    
    const gameMount = document.getElementById('gameMount') || document.body;
    gameMount.addEventListener('touchstart', handleDown, { passive: false });
    gameMount.addEventListener('touchend', handleUp);
    gameMount.addEventListener('touchcancel', handleUp);

    inputListenersBound = true;
}
