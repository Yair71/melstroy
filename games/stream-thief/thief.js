// games/stream-thief/thief.js
import { loadedAssets } from './assets.js';
import { CONFIG } from './config.js';

export let handGroup;

export function initThief(scene) {
  handGroup = new THREE.Group();
  
  const handGltf = loadedAssets.models['hand'];
  if (handGltf) {
    handGltf.scene.scale.set(CONFIG.handScale, CONFIG.handScale, CONFIG.handScale);
    
    // Центрируем модельку руки внутри группы
    const box = new THREE.Box3().setFromObject(handGltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    handGltf.scene.position.set(-center.x, -center.y, -center.z);

    // Поворачиваем руку так, чтобы она тянулась ОТ камеры к столу
    handGltf.scene.rotation.y = Math.PI; 

    handGroup.add(handGltf.scene);
  }

  // Ставим руку справа-снизу от камеры
  handGroup.position.set(CONFIG.handBaseX, CONFIG.handBaseY, CONFIG.handBaseZ);
  scene.add(handGroup);
}

export function updateThief(deltaTime) {
  // Логику движения руки добавим, как только убедимся, что визуал идеальный
}
