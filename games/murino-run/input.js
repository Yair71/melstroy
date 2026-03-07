// games/murino-run/input.js
import { state } from './gameState.js';
import { CONFIG } from './config.js';
import { moveLane, triggerJump, startRunning } from './player.js';

let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 30; 

export function setupInput() {
    window.addEventListener('keydown', handleKeyDown);

    const gameContainer = document.getElementById('app'); 
    if (gameContainer) {
        gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
        gameContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
}

export function cleanupInput() {
    window.removeEventListener('keydown', handleKeyDown);
    const gameContainer = document.getElementById('app');
    if (gameContainer) {
        gameContainer.removeEventListener('touchstart', handleTouchStart);
        gameContainer.removeEventListener('touchend', handleTouchEnd);
    }
}

function handleKeyDown(e) {
    if (state.is(CONFIG.states.INTRO)) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            startGame();
        }
        return;
    }

    if (!state.is(CONFIG.states.PLAYING)) return;

    switch(e.code) {
        case 'ArrowLeft':
        case 'KeyA':
            moveLane(-1);
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveLane(1);
            break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
            triggerJump();
            break;
    }
}

function handleTouchStart(e) {
    if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
}

function handleTouchEnd(e) {
    if (state.is(CONFIG.states.INTRO)) {
        startGame();
        return;
    }

    if (!state.is(CONFIG.states.PLAYING)) return;

    if (e.changedTouches.length > 0) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
                if (deltaX > 0) {
                    moveLane(1); 
                } else {
                    moveLane(-1); 
                }
            }
        } else {
            if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
                if (deltaY < 0) { 
                    triggerJump();
                }
            }
        }
    }
}

function startGame() {
    state.set(CONFIG.states.PLAYING);
    startRunning();
    
    // Скрываем UI подсказку
    const startUi = document.getElementById('startHintUi');
    if (startUi) startUi.style.display = 'none';
}
