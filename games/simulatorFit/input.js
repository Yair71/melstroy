// ============================================================
// input.js — Keyboard + touch/mouse input (FIXED)
//
// BUG FIX: mousemove was constantly setting touchX even without
// clicking, which locked the player to the mouse cursor position
// and overrode keyboard input. Now mouse only works on drag.
//
// BUG FIX: coordinate scaling was wrong with object-fit:contain.
// Now we compute the actual rendered area inside the canvas element.
// ============================================================
import { gameState } from './gameState.js';
import { CONFIG } from './config.js';

let cleanupFns = [];

export function initInput(canvas) {

    // ===== Coordinate helper: handles object-fit:contain scaling =====
    function canvasCoord(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const canvasAspect = canvas.width / canvas.height;
        const elemAspect = rect.width / rect.height;

        let renderW, renderH, offsetX, offsetY;

        if (elemAspect > canvasAspect) {
            // Pillarboxed (black bars on sides)
            renderH = rect.height;
            renderW = rect.height * canvasAspect;
            offsetX = (rect.width - renderW) / 2;
            offsetY = 0;
        } else {
            // Letterboxed (black bars top/bottom)
            renderW = rect.width;
            renderH = rect.width / canvasAspect;
            offsetX = 0;
            offsetY = (rect.height - renderH) / 2;
        }

        const x = ((clientX - rect.left - offsetX) / renderW) * canvas.width;
        const y = ((clientY - rect.top - offsetY) / renderH) * canvas.height;

        return { x, y };
    }

    // ===== KEYBOARD =====
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

    // ===== TOUCH =====
    const onTouchStart = (e) => {
        // Don't prevent default on menu/gameover screens — let click handler work
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

    // ===== MOUSE (click-drag only, NOT passive hover) =====
    let mouseDown = false;

    const onMouseDown = (e) => {
        // Only track for game movement, not menu clicks
        if (gameState.current === 'PLAYING') {
            mouseDown = true;
            const pos = canvasCoord(e.clientX, e.clientY);
            gameState.touchActive = true;
            gameState.touchX = pos.x;
        }
    };

    const onMouseMove = (e) => {
        if (!mouseDown) return; // ← KEY FIX: only track when button is held
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

    // ===== BIND =====
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
