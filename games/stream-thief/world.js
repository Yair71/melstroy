import { loadedAssets } from './assets.js';
import { CONFIG } from './config.js';
import { gameState } from './gameState.js';

// Loot items scattered in the world
export const lootItems = [];

// Exported so index.js can access room bounds for camera setup
export let roomBounds = null;

export function initWorld(scene) {
    scene.background = new THREE.Color(0x1a1a2e);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Monitor glow
    const monitorLight = new THREE.PointLight(0x4488ff, 0.6, 10);
    monitorLight.position.set(1.5, 3, -3.0);
    scene.add(monitorLight);

    // Warm room light
    const roomLight = new THREE.PointLight(0xffaa44, 0.5, 15);
    roomLight.position.set(0, 5, 0);
    scene.add(roomLight);

    // 1. Load room.glb
    const roomGltf = loadedAssets.models['room'];
    if (roomGltf) {
        const room = roomGltf.scene;
        room.scale.setScalar(CONFIG.roomScale);
        room.position.set(
            CONFIG.roomPosition.x,
            CONFIG.roomPosition.y,
            CONFIG.roomPosition.z
        );

        room.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        scene.add(room);

        // === DEBUG: Log all mesh names and their positions ===
        if (CONFIG.debug) {
            console.log('=== ROOM.GLB MESH LIST ===');
            room.traverse((child) => {
                if (child.isMesh || child.isGroup || child.isObject3D) {
                    child.updateWorldMatrix(true, false);
                    const worldPos = new THREE.Vector3();
                    child.getWorldPosition(worldPos);
                    const box = new THREE.Box3().setFromObject(child);
                    const size = box.getSize(new THREE.Vector3());
                    console.log(
                        `  ${child.type} "${child.name}" | ` +
                        `WorldPos(${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}, ${worldPos.z.toFixed(2)}) | ` +
                        `Size(${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)})`
                    );
                }
            });

            // Room bounding box
            const roomBox = new THREE.Box3().setFromObject(room);
            const roomCenter = roomBox.getCenter(new THREE.Vector3());
            const roomSize = roomBox.getSize(new THREE.Vector3());
            roomBounds = { box: roomBox, center: roomCenter, size: roomSize };

            console.log('=== ROOM BOUNDS ===');
            console.log(`  Min: (${roomBox.min.x.toFixed(2)}, ${roomBox.min.y.toFixed(2)}, ${roomBox.min.z.toFixed(2)})`);
            console.log(`  Max: (${roomBox.max.x.toFixed(2)}, ${roomBox.max.y.toFixed(2)}, ${roomBox.max.z.toFixed(2)})`);
            console.log(`  Center: (${roomCenter.x.toFixed(2)}, ${roomCenter.y.toFixed(2)}, ${roomCenter.z.toFixed(2)})`);
            console.log(`  Size: (${roomSize.x.toFixed(2)}, ${roomSize.y.toFixed(2)}, ${roomSize.z.toFixed(2)})`);

            // Add axes helper at origin
            const axes = new THREE.AxesHelper(5);
            scene.add(axes);

            // Add wireframe box around the room
            const boxHelper = new THREE.Box3Helper(roomBox, 0x00ff00);
            scene.add(boxHelper);

            // Add grid
            const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
            scene.add(grid);
        }
    }

    // 2. Scatter loot
    spawnLoot(scene);
}

function spawnLoot(scene) {
    const itemsGltf = loadedAssets.models['items'];
    if (!itemsGltf) return;

    for (let i = 0; i < CONFIG.lootPositions.length; i++) {
        const pos = CONFIG.lootPositions[i];

        const lootClone = itemsGltf.scene.clone(true);
        lootClone.scale.setScalar(CONFIG.itemsScale);

        lootClone.position.set(pos.x, pos.y, pos.z);
        lootClone.rotation.y = Math.random() * Math.PI * 2;

        lootClone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        lootClone.userData = {
            index: i,
            collected: false,
            originalY: pos.y,
            bobTimer: Math.random() * Math.PI * 2
        };

        scene.add(lootClone);
        lootItems.push(lootClone);

        // Debug: mark loot positions with small spheres
        if (CONFIG.debug) {
            const marker = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true })
            );
            marker.position.set(pos.x, pos.y, pos.z);
            scene.add(marker);
        }
    }
}

export function updateLoot(deltaTime) {
    for (const loot of lootItems) {
        if (loot.userData.collected) continue;
        loot.userData.bobTimer += deltaTime * 2;
        loot.position.y = loot.userData.originalY + Math.sin(loot.userData.bobTimer) * 0.05;
        loot.rotation.y += deltaTime * 0.5;
    }
}

export function collectLoot(lootItem, scene) {
    if (!lootItem || lootItem.userData.collected) return;

    lootItem.userData.collected = true;
    gameState.lootCollected++;

    const startScale = lootItem.scale.x;
    let timer = 0;
    const duration = 0.5;

    function animateCollect() {
        timer += 0.016;
        const t = Math.min(timer / duration, 1);
        lootItem.position.y += 0.1;
        lootItem.scale.setScalar(startScale * (1 - t));
        lootItem.rotation.y += 0.3;
        if (t < 1) {
            requestAnimationFrame(animateCollect);
        } else {
            scene.remove(lootItem);
        }
    }
    animateCollect();
}
