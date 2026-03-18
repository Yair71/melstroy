// games/stream-thief/index.js
import { loadAssets } from './assets.js';
import { initWorld } from './world.js';
import { initStreamer, updateStreamer } from './streamer.js';
import { initThief, updateThief } from './thief.js';
import { initLoot } from './loot.js';

export function createGame(root, api) {
  let scene, renderer, camera, clock;
  let animationId;
  let isRunning = false;

  async function init3D() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    // Камера смотрит на спину Мела и на стол
    const width = root.clientWidth || window.innerWidth;
    const height = root.clientHeight || window.innerHeight;
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 6, 8); // Мы сзади
    camera.lookAt(0, 3, -3);      // Смотрим на мониторы/стол

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    root.appendChild(renderer.domElement);

    // Ждем загрузки твоих GLB
    const assetsLoaded = await loadAssets();
    if (!assetsLoaded) {
      root.innerHTML = '<h2 style="color:red; text-align:center;">Failed to load assets. Check config.js paths!</h2>';
      return;
    }

    // Инициализируем всё из твоих моделек
    initWorld(scene);
    initStreamer(scene);
    initThief(scene);
    initLoot(scene);

    animate();
  }

  function animate() {
    if (!isRunning) return;
    animationId = requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    updateStreamer(deltaTime); // Анимирует и меняет позы
    updateThief(deltaTime);

    renderer.render(scene, camera);
  }

  return {
    start: () => {
      if (isRunning) return;
      isRunning = true;
      root.innerHTML = '';
      init3D();
    },
    stop: () => {
      isRunning = false;
      if (animationId) cancelAnimationFrame(animationId);
      if (root) root.innerHTML = '';
      if (renderer) renderer.dispose();
    }
  };
}
