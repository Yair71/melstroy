import { loadedAssets } from './assets.js';
import { CONFIG } from './config.js';

export let tableTopY = 1.5; // Дефолт стал ниже
export let tableCenterZ = -1.5;

export function initWorld(scene) {
    scene.background = new THREE.Color(0x0a0a10);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 10, 5);
    scene.add(dirLight);

    // 1. Комната и поиск стола
    const roomGltf = loadedAssets.models['room'];
    if (roomGltf) {
        roomGltf.scene.scale.set(CONFIG.roomScale, CONFIG.roomScale, CONFIG.roomScale);
        
        // Ставим комнату ровно на пол (Y = 0)
        roomGltf.scene.position.set(0, 0, -2);
        
        // Ищем стол
        roomGltf.scene.traverse((child) => {
            if (child.isMesh && child.name.toLowerCase().includes('table')) {
                const box = new THREE.Box3().setFromObject(child);
                tableTopY = box.max.y;
                tableCenterZ = box.getCenter(new THREE.Vector3()).z;
                console.log("Стол найден! Высота:", tableTopY);
            }
        });
        scene.add(roomGltf.scene);
    }

    // 2. Лут на столе
    const itemsGltf = loadedAssets.models['items'];
    if (itemsGltf) {
        // Лут тоже делаем поменьше, раз мы уменьшили комнату
        itemsGltf.scene.scale.set(0.2, 0.2, 0.2);
        itemsGltf.scene.position.set(0, tableTopY, tableCenterZ);
        scene.add(itemsGltf.scene);
    }

    // 3. Процедурный стул
    const chairGroup = new THREE.Group();
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    
    const seatGeo = new THREE.BoxGeometry(1.5, 0.2, 1.5);
    const seat = new THREE.Mesh(seatGeo, chairMat);
    seat.position.set(0, CONFIG.seatHeight - 0.1, CONFIG.streamerZ);
    
    const backrestGeo = new THREE.BoxGeometry(1.5, 2.0, 0.2);
    const backrest = new THREE.Mesh(backrestGeo, chairMat);
    backrest.position.set(0, CONFIG.seatHeight + 1.0, CONFIG.streamerZ + 0.8);
    
    const baseGeo = new THREE.CylinderGeometry(0.1, 0.1, CONFIG.seatHeight);
    const base = new THREE.Mesh(baseGeo, chairMat);
    base.position.set(0, CONFIG.seatHeight / 2, CONFIG.streamerZ);

    chairGroup.add(seat, backrest, base);
    scene.add(chairGroup);
}
