// games/stream-thief/index.js
import { loadAssets } from './assets.js';
import { initWorld } from './world.js';
import { initStreamer, updateStreamer } from './streamer.js';
import { initThief, updateThief } from './thief.js';
import { initLoot } from './loot.js';
import { initUI, showReadyToStart, updateUI, showError } from './ui.js'; // ПОДКЛЮЧИЛИ UI
import { gameState } from './gameState.js';
import { STATE } from './config.js';

export function createGame(root, api) {
  let scene, renderer, camera, clock;
  let animationId;
  let isRunning = false;

  window.mellApi = api;

  async function init3D() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    const width = root.clientWidth || window.innerWidth;
    const height = root.clientHeight || window.innerHeight;
    
    // Камера
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 6, 8); 
    camera.lookAt(0, 3, -3);      

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    root.appendChild(renderer.domElement);

    // ЖДЕМ ЗАГРУЗКИ (На экране висит надпись "ЗАГРУЗКА ЛУТА...")
    const assetsLoaded = await loadAssets();
    if (!assetsLoaded) {
      showError("ОШИБКА ЗАГРУЗКИ МОДЕЛЕЙ!");
      return;
    }

    // Спавним объекты только после загрузки
    initWorld(scene);
    initStreamer(scene);
    initThief(scene);
    initLoot(scene);

    window.addEventListener('resize', onResize);

    // Убираем загрузку, показываем кнопку старта
    showReadyToStart();

    animate();
  }

  function startMatch() {
    gameState.reset();
    gameState.current = STATE.PLAYING;
  }

  function restartMatch() {
    gameState.reset();
    gameState.current = STATE.INTRO;
  }

  function animate() {
    if (!isRunning) return;
    animationId = requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    
    // Обновляем 3D мир
    updateStreamer(deltaTime); 
    updateThief(deltaTime);

    // Обновляем счет и интерфейс
    updateUI();

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function onResize() {
    if (!camera || !renderer || !root) return;
    camera.aspect = root.clientWidth / root.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(root.clientWidth, root.clientHeight);
  }

  return {
    start: () => {
      if (isRunning) return;
      isRunning = true;
      root.innerHTML = '';
      
      // Сначала инициализируем UI (вешаем слои поверх Canvas)
      initUI(root, startMatch, restartMatch);
      
      // Потом запускаем 3D-движок
      init3D();
    },
    stop: () => {
      isRunning = false;
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      if (root) root.innerHTML = '';
      if (renderer) renderer.dispose();
    }
  };
}
