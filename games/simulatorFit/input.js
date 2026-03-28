// ============================================================
// input.js — Keyboard + touch input
// ============================================================
import { gameState } from './gameState.js';

let cleanupFns = [];
let canvasRef = null;

export function initInput(canvas) {
    canvasRef = canvas;

    const onKeyDown = (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') gameState.moveLeft = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') gameState.moveRight = true;
    };

    const onKeyUp = (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') gameState.moveLeft = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') gameState.moveRight = false;
    };

    const onTouchStart = (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        gameState.touchX = (touch.clientX - rect.left) / rect.width * canvas.width;
    };

    const onTouchMove = (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        gameState.touchX = (touch.clientX - rect.left) / rect.width * canvas.width;
    };

    const onTouchEnd = () => {
        gameState.touchX = null;
    };

    const onMouseMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        gameState.touchX = (e.clientX - rect.left) / rect.width * canvas.width;
    };

    const onMouseLeave = () => {
        gameState.touchX = null;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    cleanupFns = [
        () => window.removeEventListener('keydown', onKeyDown),
        () => window.removeEventListener('keyup', onKeyUp),
        () => canvas.removeEventListener('touchstart', onTouchStart),
        () => canvas.removeEventListener('touchmove', onTouchMove),
        () => canvas.removeEventListener('touchend', onTouchEnd),
        () => canvas.removeEventListener('mousemove', onMouseMove),
        () => canvas.removeEventListener('mouseleave', onMouseLeave)
    ];
}

export function cleanupInput() {
    for (const fn of cleanupFns) fn();
    cleanupFns = [];
}
