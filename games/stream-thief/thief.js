// games/stream-thief/thief.js
import { loadedAssets } from './assets.js';
import { CONFIG } from './config.js';

export let handGroup;
let time = 0;

export function initThief(scene) {
  handGroup = new THREE.Group();
  
  const handGltf = loadedAssets.models['hand'];
  if (handGltf) {
    handGltf.scene.scale.set(CONFIG.handScale, CONFIG.handScale, CONFIG.handScale);
    
    // Просто поворачиваем от нас, без смещений центра
    handGltf.scene.rotation.y = Math.PI; 
    handGroup.add(handGltf.scene);
  }

  // Ставим справа снизу перед камерой
  handGroup.position.set(CONFIG.handBaseX, CONFIG.handBaseY, CONFIG.handBaseZ);
  scene.add(handGroup);
}

export function updateThief(deltaTime) {
  if (!handGroup) return;
  time += deltaTime;

  // ОЖИВЛЯЕМ РУКУ: плавное покачивание (эффект дыхания)
  const bobbingY = Math.sin(time * 2) * 0.1;
  const bobbingX = Math.cos(time * 1.5) * 0.05;

  handGroup.position.y = CONFIG.handBaseY + bobbingY;
  handGroup.position.x = CONFIG.handBaseX + bobbingX;
}
