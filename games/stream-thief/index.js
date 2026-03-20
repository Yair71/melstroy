// games/stream-thief/index.js
import { loadAssets } from './assets.js';
import { initWorld } from './world.js';
import { initStreamer, updateStreamer } from './streamer.js';
import { initThief, updateThief } from './thief.js';
import { initLoot } from './loot.js';
import { initUI, showReadyToStart, updateUI, showError } from './ui.js'; 
import { initInput } from './input.js'; // ОБЯЗАТЕЛЬНО ИНИЦИАЛИЗИРУЕМ ВВОД
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
    
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    // КАМЕРА ОТОДВИНУТА НАЗАД (Z: 7) И ВВЕРХ (Y: 4)
    camera.position.set(0, 4, 7); 
    camera.lookAt(0, 2.5, -4); // Смотрит на стол      

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    root.appendChild(renderer.domElement);

    const assetsLoaded = await loadAssets();
    if (!assetsLoaded) {
      showError("ОШИБКА ЗАГРУЗКИ МОДЕЛЕЙ!");
      return;
    }

    initWorld(scene);
    initStreamer(scene);
    initThief(scene);
    initLoot(scene);
    initInput(); // ЗАПУСКАЕМ СЛУШАТЕЛЬ ПРОБЕЛА/ТАПА

    window.addEventListener('resize', onResize);
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
    
    if (gameState.current === STATE.PLAYING) {
      updateStreamer(deltaTime); 
      updateThief(deltaTime); // ОБНОВЛЯЕМ РУКУ ТОЛЬКО В ИГРЕ
    }

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
      initUI(root, startMatch, restartMatch);
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
