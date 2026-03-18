// games/stream-thief/ui.js
import { STATE } from './config.js';
import { gameState } from './gameState.js';

let container;
let uiLayer, loadingScreen, introScreen, hudLayer, gameOverScreen;

export function initUI(gameContainer, onStartMatch, onRestart) {
  container = gameContainer;

  // Главный слой UI поверх Canvas
  uiLayer = document.createElement('div');
  uiLayer.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:10; font-family:sans-serif;';
  container.appendChild(uiLayer);

  const style = document.createElement('style');
  style.innerHTML = `@keyframes pulseMsg { 0% { opacity: 0.5; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1.05); } }`;
  document.head.appendChild(style);

  // Экран загрузки
  loadingScreen = document.createElement('div');
  loadingScreen.style.cssText = 'position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#0a0a0f; pointer-events:auto; z-index:30;';
  loadingScreen.innerHTML = `
    <h1 style="color:#FFD700; text-shadow:2px 2px 0 #000; font-size:30px; animation: pulseMsg 1s infinite alternate; text-transform:uppercase;">ЗАГРУЗКА ЛУТА...</h1>
  `;
  uiLayer.appendChild(loadingScreen);

  // Интро-экран (после загрузки)
  introScreen = document.createElement('div');
  introScreen.style.cssText = 'position:absolute; inset:0; display:none; flex-direction:column; align-items:center; justify-content:flex-end; padding-bottom: 20%; pointer-events:auto; cursor:pointer; z-index:25;';
  introScreen.innerHTML = `
    <h1 style="color:#00FF41; text-shadow:3px 3px 0 #000; font-size:36px; text-transform:uppercase; animation: pulseMsg 1s infinite alternate;">ТАПАЙ ДЛЯ СТАРТА!</h1>
  `;
  uiLayer.appendChild(introScreen);

  introScreen.addEventListener('click', () => {
    introScreen.style.display = 'none';
    hudLayer.style.display = 'flex';
    onStartMatch();
  });

  // HUD (Очки и Монеты)
  hudLayer = document.createElement('div');
  hudLayer.style.cssText = 'position:absolute; top:20px; left:20px; right:20px; display:none; justify-content:space-between; color:#fff; font-size:24px; font-weight:900; text-shadow:2px 2px 0 #000; font-family: "Impact", sans-serif;';
  hudLayer.innerHTML = `
    <div style="background: rgba(0,0,0,0.6); padding: 8px 15px; border-radius: 10px; border: 2px solid #fff;">SCORE: <span id="stScore">0</span></div>
  `;
  uiLayer.appendChild(hudLayer);

  // Экран поражения (Спалился)
  gameOverScreen = document.createElement('div');
  gameOverScreen.style.cssText = 'position:absolute; inset:0; background:rgba(0,0,0,0.9); display:none; flex-direction:column; align-items:center; justify-content:center; color:#fff; text-shadow:2px 2px 0 #000; pointer-events:auto; z-index:20;';
  gameOverScreen.innerHTML = `
    <h1 style="font-size:50px; margin:0; color:#FF003C; text-align:center;">МЕЛ ПРОСНУЛСЯ!</h1>
    <h2 style="margin:10px 0;">УКРАДЕНО: <span id="goScore">0</span></h2>
    <button id="btnRestart" style="margin-top:30px; padding:15px 40px; font-size:24px; font-weight:bold; background:#FF003C; color:#fff; border:none; border-radius:10px; cursor:pointer; box-shadow:0 4px 0 #8f0022;">СНОВА</button>
  `;
  uiLayer.appendChild(gameOverScreen);

  gameOverScreen.querySelector('#btnRestart').addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    introScreen.style.display = 'flex'; // Возвращаем интро
    onRestart();
  });
}

export function showReadyToStart() {
  loadingScreen.style.display = 'none';
  introScreen.style.display = 'flex';
  gameState.current = STATE.INTRO;
}

export function showError(msg) {
  loadingScreen.innerHTML = `<h2 style="color:red; text-align:center;">${msg}</h2>`;
}

export function updateUI() {
  if (gameState.current === STATE.PLAYING) {
    document.getElementById('stScore').innerText = Math.floor(gameState.score);
  } else if (gameState.current === STATE.CAUGHT) {
    hudLayer.style.display = 'none';
    document.getElementById('goScore').innerText = Math.floor(gameState.score);
    
    // Показываем экран смерти, если он еще не показан
    if (gameOverScreen.style.display !== 'flex') {
      gameOverScreen.style.display = 'flex';
      
      // Выдаем кэш в лобби
      if (window.mellApi && gameState.score > 0) {
        window.mellApi.addCoins(Math.floor(gameState.score / 10)); // Конвертация очков в монеты
        window.mellApi.onUiUpdate();
      }
    }
  }
}
