// ============================================================
// input.js — Space / Tap input for hand phases
// In DEBUG mode, hand input is disabled (WASD controls camera)
// ============================================================
import { STATE, PHASE, DEBUG } from './config.js';
import { gameState } from './gameState.js';

let cleanupFns = [];

export function initInput() {
    // In debug fly-camera mode, we skip hand input so WASD doesn't conflict
    if (DEBUG) {
        console.log('🎮 Input: DEBUG mode — hand input disabled, use fly camera (WASD + mouse)');
        return;
    }

    const onKeyDown = (e) => {
        if (e.code !== 'Space') return;
        e.preventDefault();
        handlePress();
    };

    const onKeyUp = (e) => {
        if (e.code !== 'Space') return;
        handleRelease();
    };

    const onTouchStart = (e) => {
        e.preventDefault();
        handlePress();
    };

    const onTouchEnd = (e) => {
        handleRelease();
    };

    const onClick = () => {
        handlePress();
        // For click, we simulate hold then release after a frame
        // User needs to use touch or space for real hold
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    cleanupFns = [
        () => window.removeEventListener('keydown', onKeyDown),
        () => window.removeEventListener('keyup', onKeyUp),
        () => window.removeEventListener('touchstart', onTouchStart),
        () => window.removeEventListener('touchend', onTouchEnd)
    ];
}

function handlePress() {
    if (gameState.current === STATE.INTRO) {
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
            // Lock Y, start reaching forward on Z
            gameState.isHolding = true;
            gameState.phase = PHASE.MOVE_Z;
            break;
        case PHASE.RETURN:
            // If they press during return, restart forward
            gameState.isHolding = true;
            gameState.phase = PHASE.MOVE_Z;
            break;
    }
}

function handleRelease() {
    if (gameState.phase === PHASE.MOVE_Z) {
        gameState.isHolding = false;
        gameState.phase = PHASE.RETURN;
    }
}

export function cleanupInput() {
    for (const fn of cleanupFns) fn();
    cleanupFns = [];
}
