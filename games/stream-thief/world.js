// games/stream-thief/world.js
import { loadedAssets } from './assets.js';
import { CONFIG } from './config.js';

// Экспортируем координаты стола для loot.js
export let tableTopY = 3.0; 
export let tableCenterZ = -4.0; 

export function initWorld(scene) {
  scene.background = new THREE.Color(0x0a0a10);
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(0, 10, 5);
  scene.add(dirLight);

  // 1. Грузим ТВОЮ комнату
  const roomGltf = loadedAssets.models['room'];
  if (roomGltf) {
    roomGltf.scene.scale.set(CONFIG.roomScale, CONFIG.roomScale, CONFIG.roomScale);
    roomGltf.scene.position.set(0, 0, -3); // Двигаем комнату вперед
    
    // Ищем стол внутри твоей модели, чтобы узнать его высоту
    roomGltf.scene.traverse((child) => {
      if (child.isMesh && child.name.toLowerCase().includes('table')) {
        const box = new THREE.Box3().setFromObject(child);
        tableTopY = box.max.y;
        tableCenterZ = box.getCenter(new THREE.Vector3()).z;
        console.log("НАШЕЛ СТОЛ! Высота:", tableTopY);
      }
    });

    scene.add(roomGltf.scene);
  } else {
    console.error("room.glb не найден!");
  }

  // 2. Строим СТУЛ для Мела (Компьютеры и мониторы удалены)
  const chairGroup = new THREE.Group();
  const chairMat = new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.7 });
  
  // Сиденье (Верхняя грань ровно на CONFIG.seatHeight)
  const seatGeo = new THREE.BoxGeometry(2.5, 0.4, 2.5);
  const seat = new THREE.Mesh(seatGeo, chairMat);
  seat.position.set(0, CONFIG.seatHeight - 0.2, CONFIG.streamerZ); 

  // Спинка
  const backrestGeo = new THREE.BoxGeometry(2.2, 3.5, 0.4);
  const backrest = new THREE.Mesh(backrestGeo, chairMat);
  backrest.position.set(0, CONFIG.seatHeight + 1.5, CONFIG.streamerZ + 1.0); 

  // Ножка
  const baseGeo = new THREE.CylinderGeometry(0.2, 0.2, CONFIG.seatHeight - 0.2);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.set(0, (CONFIG.seatHeight - 0.2) / 2, CONFIG.streamerZ);

  chairGroup.add(seat, backrest, base);
  scene.add(chairGroup);
}
