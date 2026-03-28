// ============================================================
// input.js — Keyboard + touch/mouse input
// Mouse only works on click-drag, not passive hover.
// Proper coordinate scaling for object-fit:contain.
// ============================================================
import { gameState } from './gameState.js';
import { CONFIG } from './config.js';

let cleanupFns = [];

export function initInput(canvas) {

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

    const onKeyDown = (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            e.preventDefault();
            gameState.moveLeft = true;
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            e.preventDefault();
            gameState.moveRight = true;
        }
    };

    const onKeyUp = (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') gameState.moveLeft = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') gameState.moveRight = false;
    };

    const onTouchStart = (e) => {
        if (gameState.current === 'PLAYING') {
            e.preventDefault();
        }
        const touch = e.changedTouches[0];
        const pos = canvasCoord(touch.clientX, touch.clientY);
        gameState.touchActive = true;
        gameState.touchX = pos.x;
    };

    const onTouchMove = (e) => {
        if (!gameState.touchActive) return;
        e.preventDefault();
        const touch = e.changedTouches[0];
        const pos = canvasCoord(touch.clientX, touch.clientY);
        gameState.touchX = pos.x;
    };

    const onTouchEnd = () => {
        gameState.touchActive = false;
        gameState.touchX = null;
    };

    let mouseDown = false;

    const onMouseDown = (e) => {
        if (gameState.current === 'PLAYING') {
            mouseDown = true;
            const pos = canvasCoord(e.clientX, e.clientY);
            gameState.touchActive = true;
            gameState.touchX = pos.x;
        }
    };

    const onMouseMove = (e) => {
        if (!mouseDown) return;
        const pos = canvasCoord(e.clientX, e.clientY);
        gameState.touchX = pos.x;
    };

    const onMouseUp = () => {
        mouseDown = false;
        gameState.touchActive = false;
        gameState.touchX = null;
    };

    const onMouseLeave = () => {
        mouseDown = false;
        gameState.touchActive = false;
        gameState.touchX = null;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);

    cleanupFns = [
        () => window.removeEventListener('keydown', onKeyDown),
        () => window.removeEventListener('keyup', onKeyUp),
        () => canvas.removeEventListener('touchstart', onTouchStart),
        () => canvas.removeEventListener('touchmove', onTouchMove),
        () => canvas.removeEventListener('touchend', onTouchEnd),
        () => canvas.removeEventListener('mousedown', onMouseDown),
        () => canvas.removeEventListener('mousemove', onMouseMove),
        () => canvas.removeEventListener('mouseup', onMouseUp),
        () => canvas.removeEventListener('mouseleave', onMouseLeave)
    ];
}

export function cleanupInput() {
    for (const fn of cleanupFns) fn();
    cleanupFns = [];
}
