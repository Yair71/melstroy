import { STATE, ASSETS } from './config.js';
import { gameState } from './gameState.js';
import { switchModel } from './player.js';

let container;
let uiLayer, startScreen, hudLayer, gameOverScreen, videoPlayer;

export function initUI(gameContainer) {
    container = gameContainer;

    // Main UI Wrapper
    uiLayer = document.createElement('div');
    uiLayer.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:10; font-family:sans-serif;';
    container.appendChild(uiLayer);

    // --- 1. START SCREEN ---
    startScreen = document.createElement('div');
    startScreen.style.cssText = 'position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.5); pointer-events:auto;';
    startScreen.innerHTML = `
        <h1 style="color:#fff; text-shadow:2px 2px 0 #000; font-size:40px; text-transform:uppercase;">Мурино Ран</h1>
        <button id="btnStartGame" style="padding:15px 40px; font-size:24px; font-weight:bold; background:#00FF41; color:#000; border:none; border-radius:10px; cursor:pointer; box-shadow:0 4px 0 #008f24;">БЕЖАТЬ!</button>
    `;
    uiLayer.appendChild(startScreen);

    // --- 2. VIDEO PLAYER (Hidden initially) ---
    videoPlayer = document.createElement('video');
    videoPlayer.src = ASSETS.video;
    videoPlayer.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:80%; max-width:400px; display:none; z-index:15; border-radius:20px; box-shadow:0 0 30px #000; pointer-events:none;';
    videoPlayer.playsInline = true;
    uiLayer.appendChild(videoPlayer);

    // --- 3. HUD (Score & Coins) ---
    hudLayer = document.createElement('div');
    hudLayer.style.cssText = 'position:absolute; top:20px; left:20px; right:20px; display:none; justify-content:space-between; color:#fff; font-size:24px; font-weight:bold; text-shadow:2px 2px 0 #000;';
    hudLayer.innerHTML = `
        <div>SCORE: <span id="hudScore">0</span></div>
        <div style="color:#00FF41;">CASH: <span id="hudCoins">0</span></div>
    `;
    uiLayer.appendChild(hudLayer);

    // --- 4. GAME OVER SCREEN ---
    gameOverScreen = document.createElement('div');
    gameOverScreen.style.cssText = 'position:absolute; inset:0; background:rgba(0,0,0,0.9); display:none; flex-direction:column; align-items:center; justify-content:center; color:#fff; text-shadow:2px 2px 0 #000; pointer-events:auto; z-index:20;';
    gameOverScreen.innerHTML = `
        <h1 style="font-size:50px; margin:0; color:#FF003C; text-align:center;">ФОГ СЪЕЛ!</h1>
        <h2 style="margin:10px 0;">SCORE: <span id="goScore">0</span></h2>
        <h2 style="color:#00FF41; margin:0;">СОВРЕТ КЭШ: <span id="goCoins">0</span></h2>
        <button id="btnRestartGame" style="margin-top:30px; padding:15px 40px; font-size:24px; font-weight:bold; background:#FF003C; color:#fff; border:none; border-radius:10px; cursor:pointer; box-shadow:0 4px 0 #8f0022;">ЕЩЕ РАЗ</button>
    `;
    uiLayer.appendChild(gameOverScreen);

    // --- EVENT LISTENERS ---
    startScreen.querySelector('#btnStartGame').addEventListener('click', playTransition);
    gameOverScreen.querySelector('#btnRestartGame').addEventListener('click', restartGame);
}

function playTransition() {
    startScreen.style.display = 'none';
    gameState.current = STATE.TRANSITION;
    
    // Show and play the meme video
    videoPlayer.style.display = 'block';
    videoPlayer.play();

    // When video ends, start the actual running game
    videoPlayer.onended = () => {
        videoPlayer.style.display = 'none';
        startGame();
    };
}

function startGame() {
    gameState.reset();
    hudLayer.style.display = 'flex';
    switchModel('run'); // Start running animation
}

function restartGame() {
    gameOverScreen.style.display = 'none';
    hudLayer.style.display = 'none';
    startScreen.style.display = 'flex'; // Go back to intro
    
    // Switch back to a random dance
    const dances = ['dance1', 'dance2'];
    switchModel(dances[Math.floor(Math.random() * dances.length)]);
    gameState.current = STATE.INTRO;
}

export function updateUI() {
    if (gameState.current === STATE.PLAYING) {
        document.getElementById('hudScore').innerText = Math.floor(gameState.score);
        document.getElementById('hudCoins').innerText = gameState.coins;
        
        // Gradually increase speed
        gameState.speed += STATE.speedMultiplier; 
        gameState.score += gameState.speed; 
    } 
    else if (gameState.current === STATE.DYING) {
        hudLayer.style.display = 'none';
        
        // Show game over screen after camera scream sequence (roughly 2 seconds)
        setTimeout(() => {
            if (gameOverScreen.style.display === 'none') {
                document.getElementById('goScore').innerText = Math.floor(gameState.score);
                document.getElementById('goCoins').innerText = gameState.coins;
                gameOverScreen.style.display = 'flex';
            }
        }, 2000);
    }
}
