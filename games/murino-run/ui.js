import { STATE, CONFIG, ASSETS } from './config.js';
import { gameState } from './gameState.js';
import { switchModel } from './player.js';
import { resetObstacles } from './obstacles.js'; 
import { resetFogMonster } from './fog.js';       

let container;
let uiLayer, introScreen, hudLayer, gameOverScreen, videoPlayer;
let isDeathScreenScheduled = false; 

export function initUI(gameContainer) {
    container = gameContainer;

    uiLayer = document.createElement('div');
    uiLayer.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:10; font-family:sans-serif;';
    container.appendChild(uiLayer);

    const style = document.createElement('style');
    style.innerHTML = `@keyframes pulseMsg { 0% { opacity: 0.5; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1.05); } }`;
    document.head.appendChild(style);

    // --- 1. ИНТРО (Только текст поверх танца) ---
    introScreen = document.createElement('div');
    introScreen.style.cssText = 'position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; padding-bottom: 20%; pointer-events:none;';
    introScreen.innerHTML = `
        <h1 style="color:#00FF41; text-shadow:3px 3px 0 #000; font-size:32px; text-transform:uppercase; animation: pulseMsg 1s infinite alternate;">Тапай или Свайпай!</h1>
    `;
    uiLayer.appendChild(introScreen);

    // --- 2. ВИДЕО ---
    videoPlayer = document.createElement('video');
    videoPlayer.src = ASSETS.video;
    videoPlayer.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:80%; max-width:400px; display:none; z-index:15; border-radius:20px; box-shadow:0 0 30px #000; pointer-events:none;';
    videoPlayer.playsInline = true;
    uiLayer.appendChild(videoPlayer);

    // --- 3. HUD ---
    hudLayer = document.createElement('div');
    hudLayer.style.cssText = 'position:absolute; top:20px; left:20px; right:20px; display:none; justify-content:space-between; color:#fff; font-size:24px; font-weight:bold; text-shadow:2px 2px 0 #000;';
    hudLayer.innerHTML = `
        <div>SCORE: <span id="hudScore">0</span></div>
        <div style="color:#00FF41;">CASH: <span id="hudCoins">0</span></div>
    `;
    uiLayer.appendChild(hudLayer);

    // --- 4. ЭКРАН СМЕРТИ ---
    gameOverScreen = document.createElement('div');
    gameOverScreen.style.cssText = 'position:absolute; inset:0; background:rgba(0,0,0,0.9); display:none; flex-direction:column; align-items:center; justify-content:center; color:#fff; text-shadow:2px 2px 0 #000; pointer-events:auto; z-index:20;';
    gameOverScreen.innerHTML = `
        <h1 style="font-size:50px; margin:0; color:#FF003C; text-align:center;">ФОГ СЪЕЛ!</h1>
        <h2 style="margin:10px 0;">SCORE: <span id="goScore">0</span></h2>
        <h2 style="color:#00FF41; margin:0;">СОБРАН КЭШ: <span id="goCoins">0</span></h2>
        <button id="btnRestartGame" style="margin-top:30px; padding:15px 40px; font-size:24px; font-weight:bold; background:#FF003C; color:#fff; border:none; border-radius:10px; cursor:pointer; box-shadow:0 4px 0 #8f0022;">ЕЩЕ РАЗ</button>
    `;
    uiLayer.appendChild(gameOverScreen);

    gameOverScreen.querySelector('#btnRestartGame').addEventListener('click', restartGame);
}

// Эту функцию теперь вызывает input.js
export function playTransition() {
    if (gameState.current !== STATE.INTRO) return;
    
    introScreen.style.display = 'none';
    gameState.current = STATE.TRANSITION;
    
    videoPlayer.style.display = 'block';
    
    videoPlayer.play().catch(e => {
        // Если браузер заблокировал автоплей видео, просто сразу запускаем игру
        console.warn("Video blocked", e);
        videoPlayer.style.display = 'none';
        startGame();
    });

    videoPlayer.onended = () => {
        videoPlayer.style.display = 'none';
        startGame();
    };
}

function startGame() {
    gameState.reset();
    resetObstacles();     
    resetFogMonster();    
    isDeathScreenScheduled = false; 

    hudLayer.style.display = 'flex';
    switchModel('run');
}

function restartGame() {
    gameOverScreen.style.display = 'none';
    hudLayer.style.display = 'none';
    introScreen.style.display = 'flex'; // Показываем прозрачный экран с текстом
    isDeathScreenScheduled = false; 

    const dances = ['dance1', 'dance2'];
    switchModel(dances[Math.floor(Math.random() * dances.length)]);
    gameState.current = STATE.INTRO;
}

export function updateUI() {
    if (gameState.current === STATE.PLAYING) {
        document.getElementById('hudScore').innerText = Math.floor(gameState.score);
        document.getElementById('hudCoins').innerText = gameState.coins;

        gameState.speed += CONFIG.speedMultiplier;
        gameState.score += (gameState.speed * 10);
    } 
    else if (gameState.current === STATE.DYING) {
        hudLayer.style.display = 'none';

        if (!isDeathScreenScheduled) {
            isDeathScreenScheduled = true;

            setTimeout(() => {
                document.getElementById('goScore').innerText = Math.floor(gameState.score);
                document.getElementById('goCoins').innerText = gameState.coins;

                if (window.mellApi && gameState.coins > 0) {
                    window.mellApi.addCoins(gameState.coins);
                    window.mellApi.onUiUpdate();
                    gameState.coins = 0;
                }

                gameOverScreen.style.display = 'flex';
            }, 2000);
        }
    }
}
