// games/stream-thief/loot.js
import { loadedAssets } from './assets.js';
import { CONFIG } from './config.js';
import { tableTopY, tableCenterZ } from './world.js'; // Берем координаты стола

export function initLoot(scene) {
  const itemsGltf = loadedAssets.models['items'];
  if (itemsGltf) {
    // Подгоняем размер лута
    itemsGltf.scene.scale.set(CONFIG.lootScale, CONFIG.lootScale, CONFIG.lootScale);
    
    // Ставим ровно на поверхность стола, который мы нашли в world.js
    // Если items.glb имеет центр внизу, он ляжет идеально.
    itemsGltf.scene.position.set(0, tableTopY, tableCenterZ + 1); 
    
    scene.add(itemsGltf.scene);
  }
}
