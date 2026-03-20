import { loadedAssets } from './assets.js';
import { CONFIG } from './config.js';
 export let tableTopY = 1.5;
export let tableCenterX = 0;
export let tableCenterZ = -1.5;
export const chairs = [];
 
export function initWorld(scene) {
    scene.background = new THREE.Color(0x0a0a10);
    
    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
 
    const dirLight = new THREE.DirectionalLight(0xffeedd, 0.9);
    dirLight.position.set(2, 8, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);
  // Dim point light above table for atmosphere
    const pointLight = new THREE.PointLight(0xffaa44, 0.5, 15);
    pointLight.position.set(0, 4, -1.5);
    scene.add(pointLight);
 
    // 1. Room model
    const roomGltf = loadedAssets.models['room'];
    if (roomGltf) { 
     const room = roomGltf.scene;
        room.scale.setScalar(CONFIG.roomScale);
        room.position.set(0, 0, -2);
 
        // Find table inside the room model
        room.traverse((child) => {
            if (child.isMesh && child.name.toLowerCase().includes('table')) {
                child.updateWorldMatrix(true, false);
                const box = new THREE.Box3().setFromObject(child);
                tableTopY = box.max.y;
                tableCenterX = box.getCenter(new THREE.Vector3()).x;
                tableCenterZ = box.getCenter(new THREE.Vector3()).z; 
              console.log('Table found! Top Y:', tableTopY, 'Center Z:', tableCenterZ);
            }
        }); 
    
        scene.add(room);
    }
   // 2. Items (loot) on the table
    const itemsGltf = loadedAssets.models['items'];
    if (itemsGltf) { 
      const items = itemsGltf.scene;
        items.scale.setScalar(CONFIG.itemsScale);
        items.position.set(tableCenterX, tableTopY, tableCenterZ);
        scene.add(items);
    } 
 // 3. Procedural chairs around the table
    createChairs(scene);
}
 
function createChairs(scene) {
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 });
    const seatH = CONFIG.chairSeatHeight;
    const count = CONFIG.chairCount;
    const spacing = CONFIG.chairSpacing;
 
    // Spread chairs evenly along X, all at same Z behind table
    const totalWidth = (count - 1) * spacing;
    const startX = -totalWidth / 2;
 
    for (let i = 0; i < count; i++) {
        const chairGroup = new THREE.Group();
        const x = startX + i * spacing;
 
        // Seat
        const seatGeo = new THREE.BoxGeometry(0.8, 0.1, 0.8);
        const seat = new THREE.Mesh(seatGeo, chairMat);
        seat.position.y = seatH;
        chairGroup.add(seat);
 
        // 4 Legs
        const legGeo = new THREE.CylinderGeometry(0.04, 0.04, seatH);
        const offsets = [
            [-0.3, -0.3], [0.3, -0.3],
            [-0.3, 0.3], [0.3, 0.3]
        ];
        for (const [lx, lz] of offsets) {
            const leg = new THREE.Mesh(legGeo, chairMat);
            leg.position.set(lx, seatH / 2, lz);
            chairGroup.add(leg);
        }
 
        // Backrest
        const backGeo = new THREE.BoxGeometry(0.8, 0.8, 0.08);
        const back = new THREE.Mesh(backGeo, chairMat);
        back.position.set(0, seatH + 0.45, 0.36);
        chairGroup.add(back);
 
        chairGroup.position.set(x, 0, CONFIG.chairZ);
        // Face the chairs toward the camera (toward +Z)
        chairGroup.rotation.y = Math.PI;
 
        scene.add(chairGroup);
        chairs.push(chairGroup);
    }
} 
