import { loadedAssets } from './assets.js';
import { CONFIG } from './config.js';
import { gameState } from './gameState.js';

// Loot items scattered in the world
export const lootItems = [];

export function initWorld(scene) {
    scene.background = new THREE.Color(0x0a0a14);

    // Lighting - match the cozy but slightly dark room feel
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    // Main directional light (from window/ceiling area)
    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.0);
    dirLight.position.set(2, 8, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Monitor glow (bluish light from the computer screen area)
    const monitorLight = new THREE.PointLight(0x4488ff, 0.6, 8);
    monitorLight.position.set(1.5, 2.5, -3.0);
    scene.add(monitorLight);

    // Warm room light (overhead or lamp)
    const roomLight = new THREE.PointLight(0xffaa44, 0.4, 12);
    roomLight.position.set(0, 4, -1);
    scene.add(roomLight);

    // 1. Load room.glb - this IS the entire room (bed, desk, shelves, curtains, etc.)
    const roomGltf = loadedAssets.models['room'];
    if (roomGltf) {
        const room = roomGltf.scene;
        room.scale.setScalar(CONFIG.roomScale);
        room.position.set(
            CONFIG.roomPosition.x,
            CONFIG.roomPosition.y,
            CONFIG.roomPosition.z
        );

        // Enable shadows on room meshes
        room.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        scene.add(room);
    }

    // 2. Scatter loot (items.glb clones) around the room
    spawnLoot(scene);
}

function spawnLoot(scene) {
    const itemsGltf = loadedAssets.models['items'];
    if (!itemsGltf) return;

    for (let i = 0; i < CONFIG.lootPositions.length; i++) {
        const pos = CONFIG.lootPositions[i];

        // Clone the items model for each loot position
        const lootClone = itemsGltf.scene.clone(true);
        lootClone.scale.setScalar(CONFIG.itemsScale);

        // Center the clone
        lootClone.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(lootClone);
        const center = box.getCenter(new THREE.Vector3());
        lootClone.position.set(
            pos.x - center.x * CONFIG.itemsScale,
            pos.y,
            pos.z - center.z * CONFIG.itemsScale
        );

        // Random rotation for variety
        lootClone.rotation.y = Math.random() * Math.PI * 2;

        // Enable shadows
        lootClone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Mark as collectible
        lootClone.userData = {
            index: i,
            collected: false,
            originalY: pos.y,
            bobTimer: Math.random() * Math.PI * 2 // Random phase for floating animation
        };

        scene.add(lootClone);
        lootItems.push(lootClone);
    }
}

export function updateLoot(deltaTime) {
    // Gentle floating/bobbing animation for uncollected loot
    for (const loot of lootItems) {
        if (loot.userData.collected) continue;

        loot.userData.bobTimer += deltaTime * 2;
        loot.position.y = loot.userData.originalY + Math.sin(loot.userData.bobTimer) * 0.05;
        loot.rotation.y += deltaTime * 0.5; // Slow spin
    }
}

export function collectLoot(lootItem, scene) {
    if (!lootItem || lootItem.userData.collected) return;

    lootItem.userData.collected = true;
    gameState.lootCollected++;

    // Animate: shrink and fly up, then remove
    const startScale = lootItem.scale.x;
    let timer = 0;
    const duration = 0.5;

    function animateCollect() {
        timer += 0.016;
        const t = Math.min(timer / duration, 1);

        lootItem.position.y += 0.1;
        const s = startScale * (1 - t);
        lootItem.scale.setScalar(s);
        lootItem.rotation.y += 0.3;

        if (t < 1) {
            requestAnimationFrame(animateCollect);
        } else {
            scene.remove(lootItem);
        }
    }
    animateCollect();
}
