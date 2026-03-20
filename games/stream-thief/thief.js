// games/stream-thief/thief.js
import { loadedAssets } from './assets.js';
import { CONFIG } from './config.js';

export let handGroup;

export function initThief(scene) {
  handGroup = new THREE.Group();
  
  const handGltf = loadedAssets.models['hand'];
  if (handGltf) {
    // Увеличиваем/уменьшаем руку, если нужно
    handGltf.scene.scale.set(CONFIG.handScale, CONFIG.handScale, CONFIG.handScale);
    
    // Центрируем модельку руки внутри группы (на всякий случай)
    const box = new THREE.Box3().setFromObject(handGltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    handGltf.scene.position.set(-center.x, -center.y, -center.z);

    handGroup.add(handGltf.scene);
  }

  // Стартовая позиция. Z=6.5 - это ПЕРЕД камерой (камера на Z=8)
  // Теперь ты точно должен ее увидеть!
  handGroup.position.set(0, CONFIG.handBaseY, CONFIG.handBaseZ);
  scene.add(handGroup);
}

export function updateThief(deltaTime) {
  // Пока рука просто висит, логику движения подключим позже
}
