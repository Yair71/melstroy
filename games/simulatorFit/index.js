// ============================================================
// index.js — Fat or Fit v3: main entry
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

    function canvasCoord(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const canvasAspect = canvas.width / canvas.height;
        const elemAspect = rect.width / rect.height;

        let renderW, renderH, offsetX, offsetY;

        if (elemAspect > canvasAspect) {
            renderH = rect.height;
            renderW = rect.height * canvasAspect;
            offsetX = (rect.width - renderW) / 2;
            offsetY = 0;
        } else {
            renderW = rect.width;
            renderH = rect.width / canvasAspect;
            offsetX = 0;
            offsetY = (rect.height - renderH) / 2;
        }

        const x = ((clientX - rect.left - offsetX) / renderW) * canvas.width;
        const y = ((clientY - rect.top - offsetY) / renderH) * canvas.height;

        return { x, y };
    }

    function init() {
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

        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('touchstart', handleTouch, { passive: false });
        window.addEventListener('keydown', handleKey);

        gameState.current = STATE.MENU;
        lastTime = performance.now();
        animate(lastTime);
    }

    function animate(timestamp) {
        if (!isRunning) return;
        animationId = requestAnimationFrame(animate);

        const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
        lastTime = timestamp;

        updateGame(dt);
        drawFrame(ctx, timestamp / 1000);
    }

    function handleClick(e) {
        const pos = canvasCoord(e.clientX, e.clientY);
        processClick(pos.x, pos.y);
    }

    function handleTouch(e) {
        if (gameState.current === STATE.MENU || gameState.current === STATE.GAMEOVER) {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const pos = canvasCoord(touch.clientX, touch.clientY);
            processClick(pos.x, pos.y);
        }
    }

    function processClick(cx, cy) {
        if (gameState.current === STATE.MENU) {
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
            startGame(gameState.mode);
        }
    }

    function handleKey(e) {
        if (e.code === 'Escape') {
            if (gameState.current === STATE.PLAYING || gameState.current === STATE.GAMEOVER) {
                saveScore();
                gameState.current = STATE.MENU;
                gameState.shakeTimer = 0;
                gameState.shakeIntensity = 0;
            }
        }
        if (e.code === 'Space') {
            if (gameState.current === STATE.GAMEOVER) {
                e.preventDefault();
                startGame(gameState.mode);
            }
        }
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
            const coins = Math.floor(finalScore / 10);
            if (coins > 0) api.addCoins(coins);
            api.addXp(Math.floor(finalScore / 5));
            api.setHighScore(finalScore);
            api.onUiUpdate?.();
        }
    }

    return {
        start() {
            if (isRunning) return;
            const backBtn = root.querySelector('#btnBack');
            const fsBtn = root.querySelector('#btnFullscreen');
            isRunning = true;
            init();
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
