// games/stream-thief/world.js
import { loadedAssets } from './assets.js';

export function initWorld(scene) {
  // Немного тумана и базовый свет
  scene.background = new THREE.Color(0x0a0a10);
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(0, 10, 5);
  scene.add(dirLight);

  // Грузим ТВОЮ комнату/стол
  const roomGltf = loadedAssets.models['room'];
  if (roomGltf) {
    // Центрируем комнату. Подгони позицию, если стол уехал.
    roomGltf.scene.position.set(0, 0, 0); 
    scene.add(roomGltf.scene);
  } else {
    console.error("room.glb не найден!");
  }
}
