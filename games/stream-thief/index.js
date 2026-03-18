// games/stream-thief/index.js
import { initInput } from './input.js';
import { initThief, updateThief } from './thief.js';
import { initWorld } from './world.js'; 
import { initLoot } from './loot.js';   
import { initStreamer, updateStreamer } from './streamer.js'; 
import { loadAssets } from './assets.js'; 
import { initUI, showReadyToStart, updateUI, showError } from './ui.js'; // Подключаем UI
import { gameState } from './gameState.js';
import { STATE } from './config.js';

export function createGame(root, api) {
  let scene, renderer, camera, clock;
  let animationId;
  let isRunning = false;

  window.mellApi = api;

  async function init3D() {
    const width = root.clientWidth || window.innerWidth;
    const height = root.clientHeight || window.innerHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f); 
    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 7, 12); 
    camera.lookAt(0, 3, -3); 

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    root.appendChild(renderer.domElement);
    
    // Запускаем загрузчик
    const assetsLoaded = await loadAssets();
    if (!assetsLoaded) {
      showError('ОШИБКА ЗАГРУЗКИ МОДЕЛЕЙ! ПРОВЕРЬ ПУТИ В CONFIG.JS');
      return;
    }

    initWorld(scene); 
    initLoot(scene);  
    initThief(scene); 
    initStreamer(scene); 
    initInput();      

    window.addEventListener('resize', onResize);

    // Модели загружены! Убираем Loading, показываем Intro
    showReadyToStart();

    animate();
  }

  function startMatch() {
    gameState.reset();
    gameState.current = STATE.PLAYING;
  }

  function restartGame() {
    gameState.reset();
    initLoot(scene); // Пересоздаем лут
    gameState.current = STATE.INTRO;
  }

  function animate() {
    if (!isRunning) return;
    animationId = requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    if (gameState.current === STATE.PLAYING || gameState.current === STATE.CAUGHT) {
      updateThief(deltaTime);
      updateStreamer(deltaTime); 
    }
    
    updateUI(); // Обновляем очки на экране

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
      root.innerHTML = ''; // Чистим контейнер
      isRunning = true;
      
      // Сначала инициализируем UI (чтобы сразу показать загрузку)
      initUI(root, startMatch, restartGame);
      
      // Затем грузим тяжелое 3D
      init3D(); 
    },
    stop: () => {
      isRunning = false;
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      if (root) root.innerHTML = '';
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
      }
    }
  };
}
