// ============================================================
// world.js — Room, floor, table detection, loot items, lights
// ============================================================
import { CONFIG, DEBUG } from './config.js';
import { loadedAssets } from './assets.js';
import { gameState } from './gameState.js';

let sceneRef;
export const lootItems = [];
export let roomBounds = null;
export let tableInfo = null;

export function initWorld(scene) {
    sceneRef = scene;

    scene.background = new THREE.Color(0x1a1a2e);

    // ===== LIGHTS =====
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    dirLight.position.set(5, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width  = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far  = 100;
    dirLight.shadow.camera.left  = -30;
    dirLight.shadow.camera.right =  30;
    dirLight.shadow.camera.top   =  30;
    dirLight.shadow.camera.bottom = -30;
    scene.add(dirLight);

    // Monitor glow
    const monitorLight = new THREE.PointLight(0x4488ff, 0.8, 15);
    monitorLight.position.set(-4, 8, -35);
    scene.add(monitorLight);

    // Warm room light
    const roomLight = new THREE.PointLight(0xffaa44, 0.6, 30);
    roomLight.position.set(0, 12, -30);
    scene.add(roomLight);

    // ===== FLOOR =====
    createFloor(scene);

    // ===== LOAD ROOM =====
    loadRoom(scene);

    // ===== SPAWN LOOT =====
    spawnLoot(scene);

    // ===== DEBUG HELPERS =====
    if (DEBUG) {
        scene.add(new THREE.AxesHelper(10));
        const grid = new THREE.GridHelper(CONFIG.floorSize, 50, 0x444444, 0x222222);
        grid.position.y = CONFIG.floorY + 0.01;
        scene.add(grid);

        // Mark the hand spawn position with a red sphere
        const handMarker = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
        );
        handMarker.position.set(CONFIG.handStartX, CONFIG.handStartY, CONFIG.handStartZ);
        scene.add(handMarker);
        console.log('%c🔴 Hand spawn marker placed at', 'color: #f00;',
            `(${CONFIG.handStartX}, ${CONFIG.handStartY}, ${CONFIG.handStartZ})`);
    }
}

function createFloor(scene) {
    // Dark concrete floor
    const floorGeo = new THREE.PlaneGeometry(CONFIG.floorSize, CONFIG.floorSize);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1f,
        roughness: 0.9,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = CONFIG.floorY;
    floor.receiveShadow = true;
    scene.add(floor);

    // Subtle secondary floor for depth
    const floor2Geo = new THREE.PlaneGeometry(CONFIG.floorSize * 3, CONFIG.floorSize * 3);
    const floor2Mat = new THREE.MeshStandardMaterial({
        color: 0x0a0a0e,
        roughness: 1.0
    });
    const floor2 = new THREE.Mesh(floor2Geo, floor2Mat);
    floor2.rotation.x = -Math.PI / 2;
    floor2.position.y = CONFIG.floorY - 0.05;
    scene.add(floor2);
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
    console.log('%c=== ROOM MESH LIST (all meshes with positions & sizes) ===', 'color: #ff0; font-weight: bold;');

    const allMeshes = [];
    room.traverse((child) => {
        if (child.isMesh) {
            child.updateWorldMatrix(true, false);
            const wp = new THREE.Vector3();
            child.getWorldPosition(wp);
            const b = new THREE.Box3().setFromObject(child);
            const s = b.getSize(new THREE.Vector3());

            allMeshes.push({ name: child.name, wp, b, s, mesh: child });

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

    // If no mesh named "table" found, try to find the largest flat surface
    // (likely a desk/table — wide in X and Z, short in Y)
    if (!tableInfo && allMeshes.length > 0) {
        console.log('%c⚠️ No "table" name found. Searching for largest flat surface...', 'color: #f80;');
        
        let bestScore = 0;
        let bestMesh = null;

        for (const m of allMeshes) {
            // Score: wide and deep, but not too tall = likely a table
            const flatness = (m.s.x * m.s.z) / (m.s.y + 0.1);
            // Must be reasonably sized (not the floor or a tiny thing)
            if (m.s.x > 1.0 && m.s.z > 1.0 && m.s.y < 5.0 && m.s.y > 0.05) {
                if (flatness > bestScore) {
                    bestScore = flatness;
                    bestMesh = m;
                }
            }
        }

        if (bestMesh) {
            tableInfo = {
                mesh: bestMesh.mesh,
                position: bestMesh.wp.clone(),
                size: bestMesh.s.clone(),
                bounds: bestMesh.b.clone()
            };
            console.log(`%c🔍 Best guess for table: "${bestMesh.name}" (flatness score: ${bestScore.toFixed(1)})`, 'color: #ff0;');
        }
    }

    if (tableInfo) {
        console.log('%c✅ TABLE FOUND!', 'color: #0f0; font-size: 14px;');
        console.log(`   Name: "${tableInfo.mesh.name}"`);
        console.log(`   Position: (${tableInfo.position.x.toFixed(2)}, ${tableInfo.position.y.toFixed(2)}, ${tableInfo.position.z.toFixed(2)})`);
        console.log(`   Size: (${tableInfo.size.x.toFixed(2)}, ${tableInfo.size.y.toFixed(2)}, ${tableInfo.size.z.toFixed(2)})`);
        console.log(`   Top Y: ${tableInfo.bounds.max.y.toFixed(2)}`);

        if (DEBUG) {
            const helper = new THREE.Box3Helper(tableInfo.bounds, 0x00ff00);
            scene.add(helper);

            const marker = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
            );
            marker.position.copy(tableInfo.position);
            marker.position.y = tableInfo.bounds.max.y + 0.5;
            scene.add(marker);
        }
    } else {
        console.warn('%c⚠️ Could not find any table. Items will use fallback positions.', 'color: #f80;');
    }

    if (DEBUG) {
        scene.add(new THREE.Box3Helper(roomBox, 0x0088ff));
    }
}

function spawnLoot(scene) {
    const itemsGltf = loadedAssets.models['items'];
    if (!itemsGltf) {
        console.warn('items.glb not found!');
        return;
    }

    // First, measure the actual size of items.glb so we can scale properly
    const measureClone = itemsGltf.scene.clone(true);
    measureClone.scale.setScalar(1.0);
    measureClone.updateMatrixWorld(true);
    const itemBox = new THREE.Box3().setFromObject(measureClone);
    const itemSize = itemBox.getSize(new THREE.Vector3());
    console.log('%c=== ITEMS.GLB SIZE (scale 1.0) ===', 'color: #f0f;');
    console.log(`  Size: (${itemSize.x.toFixed(2)}, ${itemSize.y.toFixed(2)}, ${itemSize.z.toFixed(2)})`);

    // Auto-scale: make items roughly 1.5 units tall
    const targetHeight = 1.5;
    const autoScale = itemSize.y > 0.01 ? targetHeight / itemSize.y : CONFIG.itemsScale;
    const finalScale = Math.min(autoScale, 3.0); // cap it
    console.log(`  Auto-scale: ${finalScale.toFixed(3)} (target height: ${targetHeight})`);

    let positions = [];

    if (tableInfo) {
        const tp = tableInfo.position;
        const ts = tableInfo.size;
        const topY = tableInfo.bounds.max.y + 0.05;

        // Scatter items across the table surface
        for (let i = 0; i < 8; i++) {
            positions.push({
                x: tp.x + (Math.random() - 0.5) * ts.x * 0.6,
                y: topY,
                z: tp.z + (Math.random() - 0.5) * ts.z * 0.6
            });
        }
    } else {
        // Fallback positions near hand area
        const baseZ = CONFIG.handStartZ - 10;
        const baseX = CONFIG.handStartX;
        positions = [
            { x: baseX - 2, y: 5.0, z: baseZ },
            { x: baseX - 1, y: 5.0, z: baseZ - 1 },
            { x: baseX,     y: 5.0, z: baseZ + 1 },
            { x: baseX + 1, y: 5.0, z: baseZ },
            { x: baseX + 2, y: 5.0, z: baseZ - 0.5 },
            { x: baseX - 1.5, y: 5.0, z: baseZ + 0.5 },
            { x: baseX + 0.5, y: 5.0, z: baseZ - 1.5 },
            { x: baseX - 0.5, y: 5.0, z: baseZ + 1.5 },
        ];
    }

    gameState.totalLoot = positions.length;

    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const clone = itemsGltf.scene.clone(true);
        clone.scale.setScalar(finalScale);
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
                new THREE.SphereGeometry(0.2, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true })
            );
            marker.position.set(pos.x, pos.y + 1, pos.z);
            scene.add(marker);
        }
    }

    console.log(`%cSpawned ${positions.length} loot items at scale ${finalScale.toFixed(3)}`, 'color: #0f0;');
}

export function updateLoot(deltaTime) {
    for (const loot of lootItems) {
        if (loot.userData.collected) continue;
        loot.userData.bobTimer += deltaTime * 2;
        loot.position.y = loot.userData.originalY + Math.sin(loot.userData.bobTimer) * 0.08;
        loot.rotation.y += deltaTime * 0.5;
    }
}

export function collectLoot(lootItem) {
    if (!lootItem || lootItem.userData.collected) return;
    lootItem.userData.collected = true;
    gameState.lootCollected++;

    const startScale = lootItem.scale.x;
    let timer = 0;

    function animateCollect() {
        timer += 0.016;
        const t = Math.min(timer / 0.5, 1);
        lootItem.position.y += 0.15;
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
