// games/stream-thief/thief.js
import { loadedAssets } from './assets.js';
import { CONFIG } from './config.js';

export let handGroup;

export function initThief(scene) {
  handGroup = new THREE.Group();
  
  const handGltf = loadedAssets.models['hand'];
  if (handGltf) {
    // Подгоняем размер руки, если она слишком большая/маленькая
    handGltf.scene.scale.set(1.5, 1.5, 1.5);
    handGroup.add(handGltf.scene);
  }

  // Стартовая позиция за камерой
  handGroup.position.set(0, 4, CONFIG.handBaseZ);
  scene.add(handGroup);
}

export function updateThief(deltaTime) {
    // Логику движения руки добавим позже, пока пусть просто висит в кадре
}
