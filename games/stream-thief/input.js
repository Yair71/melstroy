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
                
                // 1. Останавливаем X
                if (gameState.thiefPhase === THIEF_PHASE.AIM_X) {
                    gameState.thiefPhase = THIEF_PHASE.AIM_Y; 
                } 
                // 2. Останавливаем Y (рука замирает)
                else if (gameState.thiefPhase === THIEF_PHASE.AIM_Y) {
                    gameState.thiefPhase = THIEF_PHASE.READY_Z; 
                }
                // 3. Зажимаем для стелса по Z
                else if (gameState.thiefPhase === THIEF_PHASE.READY_Z || gameState.thiefPhase === THIEF_PHASE.STEAL_Z) {
                    gameState.thiefPhase = THIEF_PHASE.STEAL_Z;
                    gameState.isHolding = true; 
                }
            }
        }
    };

    const handleUp = (e) => {
        if (e.code === 'Space' || e.type === 'touchend' || e.type === 'touchcancel') {
            if (e.code === 'Space') e.preventDefault();
            
            // Если отпустили во время кражи -> срочно прячем руку
            if (gameState.thiefPhase === THIEF_PHASE.STEAL_Z) {
                gameState.isHolding = false; 
                gameState.thiefPhase = THIEF_PHASE.RETURNING; // Переключаем на возврат
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
