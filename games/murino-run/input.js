import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { switchModel } from './player.js';
import { playTransition } from './ui.js';

let touchStartX = 0;
let touchStartY = 0;

export function initInput() {
    // --- ЖЕЛЕЗОБЕТОННЫЙ КЛИК/ТАП ДЛЯ СТАРТА (ПК и ТЕЛЕФОН) ---
    window.addEventListener('pointerdown', () => {
        if (gameState.current === STATE.INTRO) {
            playTransition();
        }
    });

    // --- KEYBOARD CONTROLS (PC) ---
    window.addEventListener('keydown', (e) => {
        if (gameState.current === STATE.INTRO) {
            playTransition();
            return;
        }

        if (gameState.current !== STATE.PLAYING) return;

        switch(e.code) {
            case 'ArrowLeft': case 'KeyA': moveLeft(); break;
            case 'ArrowRight': case 'KeyD': moveRight(); break;
            case 'Space': case 'ArrowUp': case 'KeyW': jump(); break;
        }
    });

    // --- SWIPE CONTROLS (MOBILE) ---
    window.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        if (gameState.current === STATE.INTRO) {
            playTransition();
            return;
        }

        if (gameState.current !== STATE.PLAYING) return;

        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        
        handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
    }, { passive: true });
}

function moveLeft() {
    if (gameState.currentLane > 0) {
        gameState.currentLane--;
        gameState.targetX = CONFIG.lanes[gameState.currentLane];
    }
}

function moveRight() {
    if (gameState.currentLane < 2) {
        gameState.currentLane++;
        gameState.targetX = CONFIG.lanes[gameState.currentLane];
    }
}

function jump() {
    if (!gameState.isJumping) {
        gameState.isJumping = true;
        gameState.velocityY = CONFIG.jumpPower;
        switchModel('jump');
    }
}

function handleSwipe(startX, startY, endX, endY) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const threshold = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > threshold) {
            if (deltaX > 0) moveRight();
            else moveLeft();
        }
    } else {
        if (Math.abs(deltaY) > threshold) {
            if (deltaY < 0) jump();
        }
    }
}
