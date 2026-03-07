// games/murino-run/input.js
import { state } from './gameState.js';
import { CONFIG } from './config.js';
import { moveLane, triggerJump, startRunning } from './player.js';

let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 30; // Минимальная длина свайпа в пикселях

export function setupInput() {
    // === Клавиатура (ПК) ===
    window.addEventListener('keydown', handleKeyDown);

    // === Свайпы (Мобилки) ===
    const gameContainer = document.getElementById('app'); // или контейнер игры
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
        // Любая клавиша стартанет игру
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
        // Тап по экрану запускает игру
        startGame();
        return;
    }

    if (!state.is(CONFIG.states.PLAYING)) return;

    if (e.changedTouches.length > 0) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Определяем направление свайпа (что больше: горизонтальный или вертикальный сдвиг)
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Горизонтальный свайп
            if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
                if (deltaX > 0) {
                    moveLane(1); // Свайп вправо
                } else {
                    moveLane(-1); // Свайп влево
                }
            }
        } else {
            // Вертикальный свайп
            if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
                if (deltaY < 0) { // Свайп ВВЕРХ (координаты Y идут сверху вниз)
                    triggerJump();
                }
            }
        }
    }
}

function startGame() {
    state.set(CONFIG.states.PLAYING);
    startRunning();
    
    // Скрываем UI подсказку "Тапни, чтобы начать" (позже добавим в html)
    const startUi = document.getElementById('startUi');
    if (startUi) startUi.style.display = 'none';
}
