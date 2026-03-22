// ============================================================
// world.js — Room, PROPER FLOOR, table scan, items ALL OVER MAP
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

    // ===== LIGHTS (strong, visible) =====
    const ambient = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 2.0);
    dirLight.position.set(5, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width  = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far  = 200;
    dirLight.shadow.camera.left  = -50;
    dirLight.shadow.camera.right =  50;
    dirLight.shadow.camera.top   =  50;
    dirLight.shadow.camera.bottom = -50;
    scene.add(dirLight);

    // Point lights for the room
    const light1 = new THREE.PointLight(0x4488ff, 1.0, 30);
    light1.position.set(-4, 10, -35);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xffaa44, 0.8, 40);
    light2.position.set(0, 15, -30);
    scene.add(light2);

    const light3 = new THREE.PointLight(0xff6644, 0.5, 25);
    light3.position.set(-8, 8, -40);
    scene.add(light3);

    // ===== FLOOR (massive, visible) =====
    createFloor(scene);

    // ===== LOAD ROOM =====
    loadRoom(scene);

    // ===== SPAWN LOOT ALL OVER THE MAP =====
    spawnLoot(scene);

    // ===== DEBUG HELPERS =====
    if (DEBUG) {
        scene.add(new THREE.AxesHelper(10));
        const grid = new THREE.GridHelper(CONFIG.floorSize, 100, 0x444444, 0x222222);
        grid.position.y = CONFIG.floorY + 0.02;
        scene.add(grid);

        // Red sphere at hand spawn
        const hm = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
        );
        hm.position.set(CONFIG.handStartX, CONFIG.handStartY, CONFIG.handStartZ);
        scene.add(hm);
    }
}

function createFloor(scene) {
    // MAIN FLOOR — dark, big, visible
    const floorGeo = new THREE.PlaneGeometry(CONFIG.floorSize, CONFIG.floorSize);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x222228,
        roughness: 0.85,
        metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = CONFIG.floorY;
    floor.receiveShadow = true;
    scene.add(floor);

    // GROUND underneath (even bigger, darker)
    const groundGeo = new THREE.PlaneGeometry(1000, 1000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0e, roughness: 1.0 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = CONFIG.floorY - 0.1;
    scene.add(ground);

    if (DEBUG) {
        console.log('%c🟫 Floor created at Y=' + CONFIG.floorY + ' size=' + CONFIG.floorSize, 'color: #a80;');
    }
}

function loadRoom(scene) {
    const roomGltf = loadedAssets.models['room'];
    if (!roomGltf) {
        console.warn('room.glb not found!');
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

    // Bounds
    room.updateMatrixWorld(true);
    const roomBox = new THREE.Box3().setFromObject(room);
    const roomCenter = roomBox.getCenter(new THREE.Vector3());
    const roomSize = roomBox.getSize(new THREE.Vector3());
    roomBounds = { box: roomBox, center: roomCenter, size: roomSize };

    console.log('%c=== ROOM BOUNDS ===', 'color:#0ff; font-weight:bold;');
    console.log(`  Min: (${roomBox.min.x.toFixed(2)}, ${roomBox.min.y.toFixed(2)}, ${roomBox.min.z.toFixed(2)})`);
    console.log(`  Max: (${roomBox.max.x.toFixed(2)}, ${roomBox.max.y.toFixed(2)}, ${roomBox.max.z.toFixed(2)})`);
    console.log(`  Size: (${roomSize.x.toFixed(2)}, ${roomSize.y.toFixed(2)}, ${roomSize.z.toFixed(2)})`);

    // ===== SCAN ALL MESHES =====
    console.log('%c=== ALL ROOM MESHES ===', 'color:#ff0; font-weight:bold;');
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
            console.log(`${prefix} "${child.name}" pos(${wp.x.toFixed(2)}, ${wp.y.toFixed(2)}, ${wp.z.toFixed(2)}) size(${s.x.toFixed(2)}, ${s.y.toFixed(2)}, ${s.z.toFixed(2)})`);

            if (isTable && !tableInfo) {
                tableInfo = { mesh: child, position: wp.clone(), size: s.clone(), bounds: b.clone() };
            }
        }
    });

    // Smart table detection fallback
    if (!tableInfo && allMeshes.length > 0) {
        let bestScore = 0, bestMesh = null;
        for (const m of allMeshes) {
            const flatness = (m.s.x * m.s.z) / (m.s.y + 0.1);
            if (m.s.x > 1.0 && m.s.z > 1.0 && m.s.y < 5.0 && m.s.y > 0.05 && flatness > bestScore) {
                bestScore = flatness;
                bestMesh = m;
            }
        }
        if (bestMesh) {
            tableInfo = { mesh: bestMesh.mesh, position: bestMesh.wp.clone(), size: bestMesh.s.clone(), bounds: bestMesh.b.clone() };
            console.log(`%c🔍 Best table guess: "${bestMesh.name}" (score: ${bestScore.toFixed(1)})`, 'color:#ff0;');
        }
    }

    if (tableInfo) {
        console.log('%c✅ TABLE FOUND!', 'color:#0f0; font-size:14px;');
        console.log(`   "${tableInfo.mesh.name}" pos(${tableInfo.position.x.toFixed(2)}, ${tableInfo.position.y.toFixed(2)}, ${tableInfo.position.z.toFixed(2)}) topY=${tableInfo.bounds.max.y.toFixed(2)}`);
        if (DEBUG) {
            scene.add(new THREE.Box3Helper(tableInfo.bounds, 0x00ff00));
        }
    }

    if (DEBUG) {
        scene.add(new THREE.Box3Helper(roomBox, 0x0088ff));
    }
}

function spawnLoot(scene) {
    const itemsGltf = loadedAssets.models['items'];
    if (!itemsGltf) { console.warn('items.glb not found!'); return; }

    // Measure items at scale 1.0
    const measureClone = itemsGltf.scene.clone(true);
    measureClone.scale.setScalar(1.0);
    measureClone.updateMatrixWorld(true);
    const itemBox = new THREE.Box3().setFromObject(measureClone);
    const itemSize = itemBox.getSize(new THREE.Vector3());
    console.log('%c=== ITEMS.GLB SIZE (scale 1.0) ===', 'color:#f0f;');
    console.log(`  Size: (${itemSize.x.toFixed(2)}, ${itemSize.y.toFixed(2)}, ${itemSize.z.toFixed(2)})`);

    // Auto-scale to ~1.5 units
    const targetH = 1.5;
    const autoScale = itemSize.y > 0.01 ? targetH / itemSize.y : CONFIG.itemsScale;
    const finalScale = Math.max(0.3, Math.min(autoScale, 5.0));
    console.log(`  Final scale: ${finalScale.toFixed(3)}`);

    // ===== SCATTER ITEMS ALL OVER THE MAP =====
    // Use room bounds if available, otherwise fallback
    let positions = [];

    if (roomBounds) {
        const rb = roomBounds.box;
        // Scatter across the entire room volume
        for (let i = 0; i < 12; i++) {
            const x = rb.min.x + Math.random() * (rb.max.x - rb.min.x);
            const z = rb.min.z + Math.random() * (rb.max.z - rb.min.z);
            // Place on surfaces — use a few different heights
            const y = rb.min.y + 0.5 + Math.random() * (rb.max.y - rb.min.y) * 0.4;
            positions.push({ x, y, z });
        }
    } else {
        // Fallback: scatter around the hand area
        for (let i = 0; i < 12; i++) {
            positions.push({
                x: CONFIG.handStartX + (Math.random() - 0.5) * 15,
                y: 3 + Math.random() * 5,
                z: CONFIG.handStartZ - 5 - Math.random() * 20
            });
        }
    }

    // If table exists, add extra items ON the table
    if (tableInfo) {
        const tp = tableInfo.position;
        const ts = tableInfo.size;
        const topY = tableInfo.bounds.max.y + 0.1;
        for (let i = 0; i < 4; i++) {
            positions.push({
                x: tp.x + (Math.random() - 0.5) * ts.x * 0.6,
                y: topY,
                z: tp.z + (Math.random() - 0.5) * ts.z * 0.6
            });
        }
    }

    gameState.totalLoot = positions.length;

    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const clone = itemsGltf.scene.clone(true);
        clone.scale.setScalar(finalScale);
        clone.position.set(pos.x, pos.y, pos.z);
        clone.rotation.y = Math.random() * Math.PI * 2;
        clone.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
        clone.userData = { index: i, collected: false, originalY: pos.y, bobTimer: Math.random() * Math.PI * 2 };
        scene.add(clone);
        lootItems.push(clone);

        if (DEBUG) {
            const mk = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true }));
            mk.position.set(pos.x, pos.y + 1, pos.z);
            scene.add(mk);
        }
    }
    console.log(`%c🎁 Spawned ${positions.length} items across the WHOLE map at scale ${finalScale.toFixed(3)}`, 'color:#0f0;');
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
        if (t < 1) requestAnimationFrame(animateCollect);
        else sceneRef.remove(lootItem);
    }
    animateCollect();
}
