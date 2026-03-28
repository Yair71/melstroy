// ============================================================
// world.js — Room, floor, table detection, loot ON surfaces,
// chair.glb model loaded and placed
// ============================================================
import { CONFIG, DEBUG } from './config.js';
import { loadedAssets, cloneModel } from './assets.js';
import { gameState } from './gameState.js';

let sceneRef;
export const lootItems = [];
export let roomBounds = null;
export let tableInfo = null;
export let chairModel = null;

// All flat surfaces found in the room (tables, shelves, desks)
const surfaces = [];

export function initWorld(scene) {
    sceneRef = scene;
    scene.background = new THREE.Color(0x1a1a2e);

    // ===== LIGHTS =====
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

    const light1 = new THREE.PointLight(0x4488ff, 1.0, 30);
    light1.position.set(-4, 10, -35);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xffaa44, 0.8, 40);
    light2.position.set(0, 15, -30);
    scene.add(light2);

    const light3 = new THREE.PointLight(0xff6644, 0.5, 25);
    light3.position.set(-8, 8, -40);
    scene.add(light3);

    // ===== FLOOR =====
    createFloor(scene);

    // ===== ROOM (clone!) =====
    loadRoom(scene);

    // ===== CHAIR.GLB =====
    loadChair(scene);

    // ===== LOOT on surfaces =====
    spawnLoot(scene);
}

// ===== FLOOR =====
function createFloor(scene) {
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

    const groundGeo = new THREE.PlaneGeometry(1000, 1000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0e, roughness: 1.0 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = CONFIG.floorY - 0.1;
    scene.add(ground);
}

// ===== ROOM — uses clone(true) to avoid singleton bug =====
function loadRoom(scene) {
    const cloned = cloneModel('room');
    if (!cloned) {
        console.warn('room.glb not found!');
        return;
    }

    const room = cloned.scene;
    room.scale.setScalar(1.0);
    room.position.set(0, 0, 0);
    scene.add(room);

    // Measure room bounds
    room.updateMatrixWorld(true);
    const roomBox = new THREE.Box3().setFromObject(room);
    const roomCenter = roomBox.getCenter(new THREE.Vector3());
    const roomSize = roomBox.getSize(new THREE.Vector3());
    roomBounds = { box: roomBox, center: roomCenter, size: roomSize };

    console.log('%c=== ROOM BOUNDS ===', 'color:#0ff; font-weight:bold;');
    console.log(`  Min: (${roomBox.min.x.toFixed(2)}, ${roomBox.min.y.toFixed(2)}, ${roomBox.min.z.toFixed(2)})`);
    console.log(`  Max: (${roomBox.max.x.toFixed(2)}, ${roomBox.max.y.toFixed(2)}, ${roomBox.max.z.toFixed(2)})`);

    // ===== SCAN ALL MESHES — find surfaces (tables, shelves, desks) =====
    console.log('%c=== ROOM MESHES ===', 'color:#ff0; font-weight:bold;');
    room.traverse((child) => {
        if (!child.isMesh) return;

        child.updateWorldMatrix(true, false);
        const wp = new THREE.Vector3();
        child.getWorldPosition(wp);
        const b = new THREE.Box3().setFromObject(child);
        const s = b.getSize(new THREE.Vector3());

        const name = (child.name || '').toLowerCase();

        // Detect flat surfaces: wide/deep but not tall
        const isFlat = s.x > 0.8 && s.z > 0.5 && s.y < 3.0 && s.y > 0.02;
        const isTable = name.includes('table') || name.includes('desk') || name.includes('stol') || name.includes('shelf') || name.includes('polka');

        if (isTable || isFlat) {
            surfaces.push({
                name: child.name,
                topY: b.max.y,
                bounds: b.clone(),
                position: wp.clone(),
                size: s.clone()
            });
        }

        // Primary table detection
        if ((name.includes('table') || name.includes('desk') || name.includes('stol')) && !tableInfo) {
            tableInfo = { mesh: child, position: wp.clone(), size: s.clone(), bounds: b.clone() };
        }

        console.log(`  "${child.name}" pos(${wp.x.toFixed(1)}, ${wp.y.toFixed(1)}, ${wp.z.toFixed(1)}) size(${s.x.toFixed(1)}, ${s.y.toFixed(1)}, ${s.z.toFixed(1)})${isFlat ? ' 📐SURFACE' : ''}`);
    });

    // Smart table fallback
    if (!tableInfo && surfaces.length > 0) {
        let best = null, bestScore = 0;
        for (const s of surfaces) {
            const score = (s.size.x * s.size.z) / (s.size.y + 0.1);
            if (score > bestScore) { bestScore = score; best = s; }
        }
        if (best) {
            tableInfo = { mesh: null, position: best.position, size: best.size, bounds: best.bounds };
            console.log(`%c🔍 Table guess: "${best.name}"`, 'color:#ff0;');
        }
    }

    if (tableInfo) {
        console.log(`%c✅ TABLE: topY=${tableInfo.bounds.max.y.toFixed(2)}`, 'color:#0f0; font-size:14px;');
    }

    console.log(`%c📐 Found ${surfaces.length} surfaces for loot placement`, 'color:#0ff;');
}

// ===== CHAIR.GLB =====
function loadChair(scene) {
    const cloned = cloneModel('chair');
    if (!cloned) {
        console.warn('chair.glb not found — using procedural chair');
        return;
    }

    const chair = cloned.scene;

    // Position: near the table, facing it
    let chairPos;
    if (tableInfo) {
        chairPos = {
            x: tableInfo.position.x,
            y: CONFIG.floorY,
            z: tableInfo.position.z + tableInfo.size.z / 2 + 2.0
        };
    } else {
        chairPos = {
            x: CONFIG.streamerPosition.x,
            y: CONFIG.floorY,
            z: CONFIG.streamerPosition.z
        };
    }

    // Scale chair: measure and normalize
    chair.scale.setScalar(1.0);
    chair.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(chair);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Target total chair height ~= chairSeatHeight * chairScale * 1.5 (seat + backrest)
    const targetHeight = CONFIG.chairSeatHeight * CONFIG.chairScale * 1.5;
    const scaleFactor = maxDim > 0.01 ? targetHeight / maxDim : CONFIG.chairScale;
    chair.scale.setScalar(scaleFactor);

    // Ground the chair
    chair.updateMatrixWorld(true);
    const newBox = new THREE.Box3().setFromObject(chair);
    chair.position.set(
        chairPos.x,
        chairPos.y - newBox.min.y,
        chairPos.z
    );

    // Face toward table (rotate 180°)
    chair.rotation.y = Math.PI;

    scene.add(chair);
    chairModel = chair;

    console.log(`%c🪑 Chair placed at (${chairPos.x.toFixed(1)}, ${chairPos.y.toFixed(1)}, ${chairPos.z.toFixed(1)}) scale=${scaleFactor.toFixed(3)}`, 'color:#fa0; font-weight:bold;');
}

// ===== LOOT — placed ON surfaces, not floating =====
function spawnLoot(scene) {
    const itemsGltf = loadedAssets.models['items'];
    if (!itemsGltf) {
        console.warn('items.glb not found!');
        return;
    }

    // ===== MEASURE original item size =====
    const measureClone = itemsGltf.scene.clone(true);
    measureClone.scale.setScalar(1.0);
    measureClone.updateMatrixWorld(true);
    const itemBox = new THREE.Box3().setFromObject(measureClone);
    const itemSize = itemBox.getSize(new THREE.Vector3());

    // ===== FIXED SCALE — consistent size for all items =====
    // Target: items should be ~1.0 unit tall
    const targetItemHeight = 1.0;
    const maxItemDim = Math.max(itemSize.x, itemSize.y, itemSize.z);
    const finalScale = maxItemDim > 0.01 ? targetItemHeight / maxItemDim : CONFIG.itemScale;

    console.log(`%c📦 Items: original(${itemSize.x.toFixed(2)}, ${itemSize.y.toFixed(2)}, ${itemSize.z.toFixed(2)}) → scale=${finalScale.toFixed(3)}`, 'color:#f0f;');

    // ===== Build placement positions ON surfaces =====
    const positions = [];

    // Place items on discovered surfaces
    for (const surf of surfaces) {
        const topY = surf.topY + 0.05; // Slightly above surface
        const bx = surf.bounds;
        const spanX = bx.max.x - bx.min.x;
        const spanZ = bx.max.z - bx.min.z;

        // Number of items per surface based on surface area
        const area = spanX * spanZ;
        const count = Math.max(1, Math.min(4, Math.floor(area / 2)));

        for (let i = 0; i < count; i++) {
            // Random position within surface bounds (with margin)
            const margin = 0.2;
            const x = bx.min.x + margin + Math.random() * Math.max(0.1, spanX - margin * 2);
            const z = bx.min.z + margin + Math.random() * Math.max(0.1, spanZ - margin * 2);
            positions.push({ x, y: topY, z });
        }
    }

    // If table found, ensure extra items on the table
    if (tableInfo) {
        const tb = tableInfo.bounds;
        const topY = tb.max.y + 0.05;
        for (let i = 0; i < 3; i++) {
            positions.push({
                x: tb.min.x + 0.3 + Math.random() * Math.max(0.1, (tb.max.x - tb.min.x) - 0.6),
                y: topY,
                z: tb.min.z + 0.3 + Math.random() * Math.max(0.1, (tb.max.z - tb.min.z) - 0.6)
            });
        }
    }

    // Fallback: if no surfaces found, place on floor in room area
    if (positions.length === 0) {
        console.warn('No surfaces found — placing loot on the floor');
        const cx = roomBounds ? roomBounds.center.x : CONFIG.streamerPosition.x;
        const cz = roomBounds ? roomBounds.center.z : CONFIG.streamerPosition.z;
        for (let i = 0; i < 8; i++) {
            positions.push({
                x: cx + (Math.random() - 0.5) * 10,
                y: CONFIG.floorY + 0.05,
                z: cz + (Math.random() - 0.5) * 10
            });
        }
    }

    // ===== SPAWN EACH ITEM =====
    gameState.totalLoot = positions.length;

    // Measure the scaled item's bottom offset
    const scaledClone = itemsGltf.scene.clone(true);
    scaledClone.scale.setScalar(finalScale);
    scaledClone.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(scaledClone);
    const bottomOffset = scaledBox.min.y; // How far below origin the bottom is

    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const clone = itemsGltf.scene.clone(true);
        clone.scale.setScalar(finalScale);

        // Ground the item: place bottom on the surface
        const groundedY = pos.y - bottomOffset;
        clone.position.set(pos.x, groundedY, pos.z);
        clone.rotation.y = Math.random() * Math.PI * 2;

        clone.traverse((c) => {
            if (c.isMesh) {
                c.castShadow = true;
                c.receiveShadow = true;
            }
        });

        clone.userData = {
            index: i,
            collected: false,
            originalY: groundedY,
            bobTimer: Math.random() * Math.PI * 2
        };

        scene.add(clone);
        lootItems.push(clone);
    }

    console.log(`%c🎁 Spawned ${positions.length} items ON surfaces, scale=${finalScale.toFixed(3)}`, 'color:#0f0; font-weight:bold;');
}

export function updateLoot(deltaTime) {
    for (const loot of lootItems) {
        if (loot.userData.collected) continue;
        // Gentle bob — small amplitude so items stay on surfaces
        loot.userData.bobTimer += deltaTime * 2;
        loot.position.y = loot.userData.originalY + Math.sin(loot.userData.bobTimer) * 0.05;
        loot.rotation.y += deltaTime * 0.3;
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
            if (sceneRef) sceneRef.remove(lootItem);
        }
    }
    animateCollect();
}
