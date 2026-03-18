// games/stream-thief/loot.js
import { loadedAssets } from './assets.js';

export function initLoot(scene) {
  const itemsGltf = loadedAssets.models['items'];
  if (itemsGltf) {
    // Ставим предметы на стол (стол примерно на z: -3)
    itemsGltf.scene.position.set(0, 3, -3); 
    scene.add(itemsGltf.scene);
  }
}
