import { STATE, PHASE } from './config.js';
import { gameState } from './gameState.js';

export function initInput() {
    const handleDown = (e) => {
        if (e.code === 'Space') e.preventDefault();
        
        if (gameState.current !== STATE.PLAYING) return;

        switch (gameState.phase) {
            case PHASE.AIM_X:
                gameState.phase = PHASE.AIM_Y; // Стоп X, начинаем Y
                break;
            case PHASE.AIM_Y:
                gameState.phase = PHASE.WAIT_Z; // Стоп Y, ждем зажатия
                break;
            case PHASE.WAIT_Z:
            case PHASE.RETURN:
                gameState.phase = PHASE.MOVE_Z; // Зажали - летим к столу
                break;
        }
    };

    const handleUp = (e) => {
        if (e.code === 'Space' || e.type === 'touchend' || e.type === 'touchcancel') {
            if (gameState.phase === PHASE.MOVE_Z) {
                gameState.phase = PHASE.RETURN; // Отпустили - возвращаемся
            }
        }
    };

    window.addEventListener('keydown', (e) => { if (e.code === 'Space') handleDown(e); }, { passive: false });
    window.addEventListener('keyup', handleUp);

    const gameMount = document.getElementById('gameMount') || document.body;
    gameMount.addEventListener('touchstart', handleDown, { passive: false });
    gameMount.addEventListener('touchend', handleUp);
    gameMount.addEventListener('touchcancel', handleUp);
}
