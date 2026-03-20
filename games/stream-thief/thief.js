// games/stream-thief/thief.js
import { loadedAssets } from './assets.js';
import { CONFIG } from './config.js';
import { gameState } from './gameState.js'; // Подключили стейт

export let handGroup;
let time = 0;

export function initThief(scene) {
  handGroup = new THREE.Group();
  
  const handGltf = loadedAssets.models['hand'];
  if (handGltf) {
    handGltf.scene.scale.set(CONFIG.handScale, CONFIG.handScale, CONFIG.handScale);
    handGltf.scene.rotation.y = Math.PI; // Тянется от нас
    handGroup.add(handGltf.scene);
  }

  handGroup.position.set(CONFIG.handBaseX, CONFIG.handBaseY, CONFIG.handBaseZ);
  scene.add(handGroup);
}

export function updateThief(deltaTime) {
  if (!handGroup) return;
  time += deltaTime;

  // 1. Движение руки (КРАЖА) по пробелу или тапу
  if (gameState.isStealing) {
    // Рука летит вперед (уменьшаем Z)
    handGroup.position.z -= CONFIG.handExtendSpeed * deltaTime;
    
    // Ограничиваем, чтобы не улетела дальше стола
    if (handGroup.position.z < CONFIG.tableZ) {
      handGroup.position.z = CONFIG.tableZ;
      // Здесь потом добавим логику сбора монет!
      gameState.score += 10 * deltaTime; 
    }
  } else {
    // Рука возвращается назад
    handGroup.position.z += CONFIG.handRetractSpeed * deltaTime;
    
    // Не даем улететь за камеру
    if (handGroup.position.z > CONFIG.handBaseZ) {
      handGroup.position.z = CONFIG.handBaseZ;
    }
  }

  // 2. Дыхание (покачивание), только когда рука отдыхает возле камеры
  if (!gameState.isStealing && handGroup.position.z >= CONFIG.handBaseZ) {
    const bobbingY = Math.sin(time * 2) * 0.1;
    const bobbingX = Math.cos(time * 1.5) * 0.05;
    handGroup.position.y = CONFIG.handBaseY + bobbingY;
    handGroup.position.x = CONFIG.handBaseX + bobbingX;
  } else {
    // В полете рука не качается
    handGroup.position.y = CONFIG.handBaseY;
    handGroup.position.x = CONFIG.handBaseX;
  }
}
