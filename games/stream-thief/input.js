// games/stream-thief/input.js
import { STATE } from './config.js';
import { gameState } from './gameState.js';

let inputListenersBound = false;

export function initInput() {
    if (inputListenersBound) return;

    const handleDown = (e) => {
        // Prevent default scrolling on mobile, but only for our game keys/touches
        if (e.code === 'Space' || e.type === 'touchstart') {
            if (e.code === 'Space') e.preventDefault();

            if (gameState.current === STATE.INTRO) {
                gameState.current = STATE.PLAYING;
            } else if (gameState.current === STATE.PLAYING) {
                gameState.isHolding = true;
            }
        }
    };

    const handleUp = (e) => {
        if (e.code === 'Space' || e.type === 'touchend' || e.type === 'touchcancel') {
            if (e.code === 'Space') e.preventDefault();
            gameState.isHolding = false;
        }
    };

    // Keyboard
    window.addEventListener('keydown', handleDown, { passive: false });
    window.addEventListener('keyup', handleUp);
    
    // Touch (bind to the game container to avoid breaking the lobby UI)
    const gameMount = document.getElementById('gameMount') || document.body;
    gameMount.addEventListener('touchstart', handleDown, { passive: false });
    gameMount.addEventListener('touchend', handleUp);
    gameMount.addEventListener('touchcancel', handleUp);

    inputListenersBound = true;
}
