// ============================================================
// world.js — Room, table detection, loot, chair, lights
// ============================================================
import { CONFIG, DEBUG } from './config.js';
import { loadedAssets } from './assets.js';
import { gameState } from './gameState.js';

let sceneRef;
export const lootItems = [];
export let roomBounds = null;
export let tableInfo = null;   // { mesh, position, size } — found from room.glb

export function initWorld(scene) {
    sceneRef = scene;

    // Background
    scene.background = new THREE.Color(0x1a1a2e);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width  = 1024;
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

    // ===== LOAD ROOM =====
    loadRoom(scene);

    // ===== SPAWN LOOT ON TABLE =====
    spawnLoot(scene);

    // ===== DEBUG HELPERS =====
    if (DEBUG) {
        scene.add(new THREE.AxesHelper(5));
        scene.add(new THREE.GridHelper(20, 20, 0x444444, 0x222222));
    }
}

function loadRoom(scene) {
    const roomGltf = loadedAssets.models['room'];
    if (!roomGltf) {
        console.warn('room.glb not found in loaded assets!');
        return;
    }

    const room = roomGltf.scene;
    room.scale.setScalar(1.0);
    room.position.set(0, 0, 0);

    room.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    scene.add(room);

    // Compute room bounds
    room.updateMatrixWorld(true);
    const roomBox = new THREE.Box3().setFromObject(room);
    const roomCenter = roomBox.getCenter(new THREE.Vector3());
    const roomSize   = roomBox.getSize(new THREE.Vector3());
    roomBounds = { box: roomBox, center: roomCenter, size: roomSize };

    console.log('%c=== ROOM BOUNDS ===', 'color: #0ff; font-weight: bold;');
    console.log(`  Min: (${roomBox.min.x.toFixed(2)}, ${roomBox.min.y.toFixed(2)}, ${roomBox.min.z.toFixed(2)})`);
    console.log(`  Max: (${roomBox.max.x.toFixed(2)}, ${roomBox.max.y.toFixed(2)}, ${roomBox.max.z.toFixed(2)})`);
    console.log(`  Center: (${roomCenter.x.toFixed(2)}, ${roomCenter.y.toFixed(2)}, ${roomCenter.z.toFixed(2)})`);
    console.log(`  Size: (${roomSize.x.toFixed(2)}, ${roomSize.y.toFixed(2)}, ${roomSize.z.toFixed(2)})`);

    // ===== SCAN ALL MESHES — FIND "TABLE" =====
    console.log('%c=== ROOM MESH LIST ===', 'color: #ff0; font-weight: bold;');
    room.traverse((child) => {
        if (child.isMesh) {
            child.updateWorldMatrix(true, false);
            const wp = new THREE.Vector3();
            child.getWorldPosition(wp);
            const b = new THREE.Box3().setFromObject(child);
            const s = b.getSize(new THREE.Vector3());

            const name = (child.name || '').toLowerCase();
            const isTable = name.includes('table') || name.includes('desk') || name.includes('stol');

            const prefix = isTable ? '🟢 TABLE →' : '  ';
            console.log(
                `${prefix} "${child.name}" pos(${wp.x.toFixed(2)}, ${wp.y.toFixed(2)}, ${wp.z.toFixed(2)}) size(${s.x.toFixed(2)}, ${s.y.toFixed(2)}, ${s.z.toFixed(2)})`
            );

            if (isTable && !tableInfo) {
                tableInfo = {
                    mesh: child,
                    position: wp.clone(),
                    size: s.clone(),
                    bounds: b.clone()
                };
            }
        }
    });

    if (tableInfo) {
        console.log('%c✅ TABLE FOUND!', 'color: #0f0; font-size: 14px;');
        console.log(`   Name: "${tableInfo.mesh.name}"`);
        console.log(`   Position: (${tableInfo.position.x.toFixed(2)}, ${tableInfo.position.y.toFixed(2)}, ${tableInfo.position.z.toFixed(2)})`);
        console.log(`   Size: (${tableInfo.size.x.toFixed(2)}, ${tableInfo.size.y.toFixed(2)}, ${tableInfo.size.z.toFixed(2)})`);

        if (DEBUG) {
            // Green wireframe box around table
            const helper = new THREE.Box3Helper(tableInfo.bounds, 0x00ff00);
            scene.add(helper);

            // Label sphere
            const marker = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
            );
            marker.position.copy(tableInfo.position);
            marker.position.y += tableInfo.size.y / 2 + 0.5;
            scene.add(marker);
        }
    } else {
        console.warn('%c⚠️ No mesh named "table"/"desk"/"stol" found. Check console mesh list above.', 'color: #f80;');
    }

    // Debug: bounding box for entire room
    if (DEBUG) {
        scene.add(new THREE.Box3Helper(roomBox, 0x00ff00));
    }
}

function spawnLoot(scene) {
    const itemsGltf = loadedAssets.models['items'];
    if (!itemsGltf) {
        console.warn('items.glb not found!');
        return;
    }

    // If we found the table, scatter items on it
    // Otherwise use fallback positions
    let positions = [];

    if (tableInfo) {
        const tp = tableInfo.position;
        const ts = tableInfo.size;
        const topY = tableInfo.bounds.max.y + 0.1;

        // Scatter items across the table surface
        for (let i = 0; i < 8; i++) {
            positions.push({
                x: tp.x + (Math.random() - 0.5) * ts.x * 0.7,
                y: topY,
                z: tp.z + (Math.random() - 0.5) * ts.z * 0.7
            });
        }
    } else {
        // Fallback — hardcoded positions
        positions = [
            { x: -2.5, y: 1.2, z: -1.0 },
            { x: -1.8, y: 1.2, z: -0.5 },
            { x: -3.0, y: 1.3, z: -1.5 },
            { x:  1.5, y: 1.6, z: -2.5 },
            { x:  2.5, y: 1.6, z: -2.0 },
            { x:  0.0, y: 0.1, z:  0.0 },
            { x: -1.0, y: 0.1, z:  1.0 },
            { x:  1.5, y: 0.1, z: -0.5 },
        ];
    }

    gameState.totalLoot = positions.length;

    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const clone = itemsGltf.scene.clone(true);
        clone.scale.setScalar(CONFIG.itemsScale);
        clone.position.set(pos.x, pos.y, pos.z);
        clone.rotation.y = Math.random() * Math.PI * 2;

        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        clone.userData = {
            index: i,
            collected: false,
            originalY: pos.y,
            bobTimer: Math.random() * Math.PI * 2
        };

        scene.add(clone);
        lootItems.push(clone);

        if (DEBUG) {
            const marker = new THREE.Mesh(
                new THREE.SphereGeometry(0.12, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true })
            );
            marker.position.set(pos.x, pos.y, pos.z);
            scene.add(marker);
        }
    }

    console.log(`Spawned ${positions.length} loot items.`);
}

// Loot bobbing animation
export function updateLoot(deltaTime) {
    for (const loot of lootItems) {
        if (loot.userData.collected) continue;
        loot.userData.bobTimer += deltaTime * 2;
        loot.position.y = loot.userData.originalY + Math.sin(loot.userData.bobTimer) * 0.05;
        loot.rotation.y += deltaTime * 0.5;
    }
}

// Called by thief when hand grabs an item
export function collectLoot(lootItem) {
    if (!lootItem || lootItem.userData.collected) return;
    lootItem.userData.collected = true;
    gameState.lootCollected++;

    const startScale = lootItem.scale.x;
    let timer = 0;

    function animateCollect() {
        timer += 0.016;
        const t = Math.min(timer / 0.5, 1);
        lootItem.position.y += 0.1;
        lootItem.scale.setScalar(startScale * (1 - t));
        lootItem.rotation.y += 0.3;
        if (t < 1) {
            requestAnimationFrame(animateCollect);
        } else {
            sceneRef.remove(lootItem);
        }
    }
    animateCollect();
}
