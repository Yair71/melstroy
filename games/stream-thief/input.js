import { STATE, PHASE } from './config.js';
import { gameState } from './gameState.js';

let cleanupFns = [];

export function initInput() {
    const onDown = (e) => {
        if (e.type === 'keydown' && e.code !== 'Space') return;
        if (e.code === 'Space') e.preventDefault();

        if (gameState.current === STATE.READY) {
            gameState.reset();
            return;
        }

        if (gameState.current !== STATE.PLAYING) return;

        switch (gameState.phase) {
            case PHASE.AIM_X:
                // Lock X, start Y oscillation
                gameState.phase = PHASE.AIM_Y;
                break;
            case PHASE.AIM_Y:
                // Lock Y, start reaching into room
                gameState.isHolding = true;
                gameState.phase = PHASE.MOVE_Z;
                break;
            case PHASE.MOVE_Z:
                // Already holding
                break;
            case PHASE.RETURN:
                // Can press again to start reaching while returning
                gameState.isHolding = true;
                gameState.phase = PHASE.MOVE_Z;
                break;
        }
    };

    const onUp = (e) => {
        if (e.type === 'keyup' && e.code !== 'Space') return;

        if (gameState.phase === PHASE.MOVE_Z) {
            gameState.isHolding = false;
            gameState.phase = PHASE.RETURN;
        }
    };

    // Keyboard
    window.addEventListener('keydown', onDown, { passive: false });
    window.addEventListener('keyup', onUp);

    // Touch
    window.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('touchend', onUp);
    window.addEventListener('touchcancel', onUp);

    // Mouse
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    cleanupFns = [
        () => window.removeEventListener('keydown', onDown),
        () => window.removeEventListener('keyup', onUp),
        () => window.removeEventListener('touchstart', onDown),
        () => window.removeEventListener('touchend', onUp),
        () => window.removeEventListener('touchcancel', onUp),
        () => window.removeEventListener('mousedown', onDown),
        () => window.removeEventListener('mouseup', onUp)
    ];
}

export function cleanupInput() {
    for (const fn of cleanupFns) fn();
    cleanupFns = [];
}
