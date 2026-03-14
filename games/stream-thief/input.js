// games/stream-thief/input.js
import { gameState, STATE } from './gameState.js';

export function initInput() {
    const handleDown = (e) => {
        // Prevent default behavior to stop screen scrolling on mobile
        if (e.code === 'Space' || e.type === 'touchstart') {
            if (e.code === 'Space') e.preventDefault();
            
            if (gameState.current === STATE.PLAYING) {
                gameState.isHolding = true;
            } else if (gameState.current === STATE.MENU || gameState.current === STATE.CAUGHT) {
                // Restart or Start game
                gameState.reset();
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
    
    // Touch devices
    const gameContainer = document.getElementById('app') || document.body;
    gameContainer.addEventListener('touchstart', handleDown, { passive: false });
    gameContainer.addEventListener('touchend', handleUp);
    gameContainer.addEventListener('touchcancel', handleUp);
}
