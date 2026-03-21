import { STATE, CONFIG } from './config.js';
import { gameState } from './gameState.js';

let uiLayer, loadingScreen, readyScreen, hudLayer;

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

    // HUD - loot counter
    hudLayer = document.createElement('div');
    hudLayer.style.cssText = 'position:absolute; top:20px; left:20px; right:20px; display:none; justify-content:space-between; color:#fff; font-size:24px; font-weight:900; text-shadow:2px 2px 0 #000; font-family: "Impact", sans-serif;';
    hudLayer.innerHTML = `
        <div style="background:rgba(0,0,0,0.6); padding:8px 16px; border-radius:10px; border:2px solid #FFD700; color:#FFD700;">
            LOOT: <span id="hudLoot">0</span> / <span id="hudTotal">${CONFIG.lootPositions.length}</span>
        </div>
        <div id="hudPhase" style="background:rgba(0,0,0,0.6); padding:8px 16px; border-radius:10px; border:2px solid #00FF41; color:#00FF41;">
            AIM X
        </div>
    `;
    uiLayer.appendChild(hudLayer);
}

export function showReady() {
    loadingScreen.style.display = 'none';
    readyScreen.style.display = 'flex';
    gameState.current = STATE.READY;
}

export function updateUI() {
    if (gameState.current === STATE.PLAYING) {
        if (readyScreen.style.display !== 'none') {
            readyScreen.style.display = 'none';
        }
        if (hudLayer.style.display !== 'flex') {
            hudLayer.style.display = 'flex';
        }

        // Update loot count
        const lootEl = document.getElementById('hudLoot');
        if (lootEl) lootEl.innerText = gameState.lootCollected;

        // Update phase hint
        const phaseEl = document.getElementById('hudPhase');
        if (phaseEl) {
            switch (gameState.phase) {
                case 'AIM_X': phaseEl.innerText = '← AIM X →'; break;
                case 'AIM_Y': phaseEl.innerText = '↑ AIM Y ↓'; break;
                case 'MOVE_Z': phaseEl.innerText = 'HOLD TO REACH!'; break;
                case 'RETURN': phaseEl.innerText = 'RETURNING...'; break;
            }
        }
    }
}

export function destroyUI() {
    if (uiLayer && uiLayer.parentNode) {
        uiLayer.parentNode.removeChild(uiLayer);
    }
}
