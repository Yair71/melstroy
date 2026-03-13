// murino-run/ui.js
import { STATES, gameState } from './gameState.js';

export class UIManager {
    constructor(container, onStart, onRestart) {
        this.container = container;
        this.onStart = onStart;
        this.onRestart = onRestart;
        
        this.createUI();
        
        // Listen to game state changes
        gameState.subscribe((data) => this.updateUI(data));
    }

    createUI() {
        // Main UI Layer
        this.uiLayer = document.createElement('div');
        this.uiLayer.style.cssText = 'position:absolute; inset:0; pointer-events:none; font-family:sans-serif; z-index:10;';
        this.container.appendChild(this.uiLayer);

        // HUD (Score & Cash)
        this.hud = document.createElement('div');
        this.hud.style.cssText = 'position:absolute; top:20px; left:20px; color:#fff; font-size:24px; font-weight:bold; text-shadow:2px 2px 0 #000; display:none;';
        this.hud.innerHTML = `
            <div>SCORE: <span id="hudScore">0</span></div>
            <div style="color:#00FF41; margin-top:5px;">КЭШ: <span id="hudCoins">0</span></div>
        `;
        this.uiLayer.appendChild(this.hud);

        // Start Screen (Intro)
        this.startScreen = document.createElement('div');
        this.startScreen.style.cssText = 'position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; padding-bottom:100px; pointer-events:auto;';
        this.startScreen.innerHTML = `
            <button id="btnStart" style="padding: 15px 50px; font-size:28px; font-weight:bold; background:#00FF41; color:#000; border:none; border-radius:10px; cursor:pointer; box-shadow: 0 4px 15px rgba(0,255,65,0.5);">ПОГНАЛИ!</button>
        `;
        this.uiLayer.appendChild(this.startScreen);
        this.startScreen.querySelector('#btnStart').addEventListener('click', () => {
            this.onStart();
        });

        // Game Over Screen
        this.gameOverScreen = document.createElement('div');
        this.gameOverScreen.style.cssText = 'position:absolute; inset:0; background:rgba(0,0,0,0.85); display:none; flex-direction:column; align-items:center; justify-content:center; color:#fff; text-shadow:2px 2px 0 #000; pointer-events:auto;';
        this.gameOverScreen.innerHTML = `
            <h1 style="font-size:48px; margin:0; color:#FF003C; text-transform:uppercase;">ФОГ СЪЕЛ!</h1>
            <h2 style="margin:10px 0;">ТВОЙ СЧЕТ: <span id="goScore">0</span></h2>
            <h2 style="color:#00FF41; margin:0;">СОБРАНО КЭША: <span id="goCoins">0</span></h2>
            <button id="btnRestart" style="margin-top:30px; padding: 15px 40px; font-size:24px; font-weight:bold; background:#fff; color:#000; border:none; border-radius:10px; cursor:pointer;">ЕЩЕ РАЗ</button>
        `;
        this.uiLayer.appendChild(this.gameOverScreen);
        this.gameOverScreen.querySelector('#btnRestart').addEventListener('click', () => {
            this.onRestart();
        });
    }

    updateUI(data) {
        // Update texts
        const hudScore = this.hud.querySelector('#hudScore');
        const hudCoins = this.hud.querySelector('#hudCoins');
        if (hudScore) hudScore.innerText = data.score;
        if (hudCoins) hudCoins.innerText = data.coins;

        // Manage visibility based on state
        switch (data.state) {
            case STATES.INTRO:
                this.startScreen.style.display = 'flex';
                this.hud.style.display = 'none';
                this.gameOverScreen.style.display = 'none';
                break;
            case STATES.PLAYING:
                this.startScreen.style.display = 'none';
                this.hud.style.display = 'block';
                this.gameOverScreen.style.display = 'none';
                break;
            case STATES.GAME_OVER:
                this.hud.style.display = 'none';
                this.gameOverScreen.style.display = 'flex';
                this.gameOverScreen.querySelector('#goScore').innerText = data.score;
                this.gameOverScreen.querySelector('#goCoins').innerText = data.coins;
                break;
        }
    }

    destroy() {
        if (this.uiLayer && this.uiLayer.parentNode) {
            this.uiLayer.parentNode.removeChild(this.uiLayer);
        }
    }
}
