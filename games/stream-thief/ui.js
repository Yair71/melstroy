import { STATE } from './config.js';
import { gameState } from './gameState.js';
 
let uiLayer, loadingScreen, readyScreen;
 
export function initUI(container) {
    uiLayer = document.createElement('div');
    uiLayer.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:10; font-family:sans-serif;';
    container.appendChild(uiLayer);
 
    // Pulse animation
    const style = document.createElement('style');
    style.innerHTML = `@keyframes pulseThief { 0% { opacity:0.5; transform:scale(0.95); } 100% { opacity:1; transform:scale(1.05); } }`;
    document.head.appendChild(style);
 
    // Loading screen
    loadingScreen = document.createElement('div');
    loadingScreen.style.cssText = 'position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:#000; pointer-events:auto; z-index:30;';
    loadingScreen.innerHTML = '<h1 style="color:#00FF41; text-shadow:2px 2px 0 #000; font-size:28px; animation:pulseThief 1s infinite alternate;">LOADING...</h1>';
    uiLayer.appendChild(loadingScreen);
 
    // Ready screen (tap to play)
    readyScreen = document.createElement('div');
    readyScreen.style.cssText = 'position:absolute; inset:0; display:none; flex-direction:column; align-items:center; justify-content:center; pointer-events:none; z-index:25;';
    readyScreen.innerHTML = '<h1 style="color:#FFD700; text-shadow:3px 3px 0 #000; font-size:32px; text-transform:uppercase; animation:pulseThief 1s infinite alternate;">TAP / SPACE TO START</h1>';
    uiLayer.appendChild(readyScreen);
}
 
export function showReady() {
    loadingScreen.style.display = 'none';
    readyScreen.style.display = 'flex';
    gameState.current = STATE.READY;
}
 
export function updateUI() {
    if (gameState.current === STATE.PLAYING && readyScreen.style.display !== 'none') {
        readyScreen.style.display = 'none';
    }
}
 
export function destroyUI() {
    if (uiLayer && uiLayer.parentNode) {
        uiLayer.parentNode.removeChild(uiLayer);
    }
}
