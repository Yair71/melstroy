// ============================================================
// index.js — Fat or Fit: main entry, wires all modules
// Follows murino-run / stream-thief createGame() pattern
// ============================================================
import { CONFIG, STATE, MODE } from './config.js';
import { gameState } from './gameState.js';
import { initInput, cleanupInput } from './input.js';
import { initRenderer, drawFrame, getMenuCardBounds } from './renderer.js';
import { updateGame } from './logic.js';

export function createGame(root, api) {
    let canvas, ctx;
    let animationId;
    let isRunning = false;
    let lastTime = 0;

    window.mellApi = api;

    function init() {
        // Create canvas
        canvas = document.createElement('canvas');
        canvas.width = CONFIG.canvasWidth;
        canvas.height = CONFIG.canvasHeight;
        canvas.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
            background: #050510;
            cursor: pointer;
            touch-action: none;
        `;
        root.appendChild(canvas);

        ctx = canvas.getContext('2d');
        initRenderer(ctx);
        initInput(canvas);

        // Menu click handlers
        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('touchstart', handleTouch, { passive: false });

        // ESC to go back to menu
        window.addEventListener('keydown', handleKey);

        gameState.current = STATE.MENU;
        lastTime = performance.now();
        animate(lastTime);
    }

    function animate(timestamp) {
        if (!isRunning) return;
        animationId = requestAnimationFrame(animate);

        const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50ms
        lastTime = timestamp;

        // Update logic
        updateGame(dt);

        // Draw
        drawFrame(ctx, timestamp / 1000);
    }

    function handleClick(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const cx = (e.clientX - rect.left) * scaleX;
        const cy = (e.clientY - rect.top) * scaleY;

        processClick(cx, cy);
    }

    function handleTouch(e) {
        if (gameState.current === STATE.MENU || gameState.current === STATE.GAMEOVER) {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const cx = (touch.clientX - rect.left) * scaleX;
            const cy = (touch.clientY - rect.top) * scaleY;
            processClick(cx, cy);
        }
    }

    function processClick(cx, cy) {
        if (gameState.current === STATE.MENU) {
            // Check which card was clicked
            const bounds = getMenuCardBounds();

            for (const mode of [MODE.OBESITY, MODE.FIT]) {
                const b = bounds[mode];
                if (b && cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
                    startGame(mode);
                    return;
                }
            }
        }

        if (gameState.current === STATE.GAMEOVER) {
            // Tap anywhere to restart with same mode
            startGame(gameState.mode);
        }
    }

    function handleKey(e) {
        if (e.code === 'Escape') {
            if (gameState.current === STATE.PLAYING || gameState.current === STATE.GAMEOVER) {
                // Save score before going to menu
                saveScore();
                gameState.current = STATE.MENU;
            }
        }
        if (e.code === 'Space') {
            if (gameState.current === STATE.GAMEOVER) {
                e.preventDefault();
                startGame(gameState.mode);
            }
        }
        // Quick start from menu
        if (gameState.current === STATE.MENU) {
            if (e.code === 'Digit1') startGame(MODE.OBESITY);
            if (e.code === 'Digit2') startGame(MODE.FIT);
        }
    }

    function startGame(mode) {
        gameState.reset(mode);
    }

    function saveScore() {
        const finalScore = Math.floor(gameState.score);
        if (finalScore > 0 && api) {
            // Add coins based on score
            const coins = Math.floor(finalScore / 10);
            if (coins > 0) api.addCoins(coins);

            // XP
            api.addXp(Math.floor(finalScore / 5));

            // High score
            api.setHighScore(finalScore);

            api.onUiUpdate?.();
        }
    }

    return {
        start() {
            if (isRunning) return;
            // Keep the back button if present
            const backBtn = root.querySelector('#btnBack');
            const fsBtn = root.querySelector('#btnFullscreen');

            isRunning = true;
            init();

            // Re-add buttons on top of canvas
            if (backBtn) root.appendChild(backBtn);
            if (fsBtn) root.appendChild(fsBtn);
        },
        stop() {
            isRunning = false;
            if (animationId) cancelAnimationFrame(animationId);
            saveScore();
            cleanupInput();
            window.removeEventListener('keydown', handleKey);
            if (canvas) {
                canvas.removeEventListener('click', handleClick);
                canvas.removeEventListener('touchstart', handleTouch);
            }
        }
    };
}
