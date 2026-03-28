// ============================================================
// world.js — Room, floor, chair.glb, loot across WHOLE room
// ============================================================
import { CONFIG, DEBUG } from './config.js';
import { loadedAssets, cloneModel } from './assets.js';
import { gameState } from './gameState.js';

let sceneRef;
export const lootItems = [];
export let roomBounds = null;
export let tableInfo = null;
export let chairModel = null;
export let chairWorldPos = null;

// All flat surfaces found in the room
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

    // ===== ROOM =====
    loadRoom(scene);

    // ===== CHAIR.GLB =====
    loadChair(scene);

    // ===== LOOT =====
    spawnLoot(scene);
}

function createFloor(scene) {
    const floorGeo = new THREE.PlaneGeometry(CONFIG.floorSize, CONFIG.floorSize);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x222228, roughness: 0.85, metalness: 0.05
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

// ===== ROOM =====
function loadRoom(scene) {
    const cloned = cloneModel('room');
    if (!cloned) { console.warn('room.glb not found!'); return; }

    const room = cloned.scene;
    room.scale.setScalar(1.0);
    room.position.set(0, 0, 0);
    scene.add(room);

    room.updateMatrixWorld(true);
    const roomBox = new THREE.Box3().setFromObject(room);
    const roomCenter = roomBox.getCenter(new THREE.Vector3());
    const roomSize = roomBox.getSize(new THREE.Vector3());
    roomBounds = { box: roomBox, center: roomCenter, size: roomSize };

    console.log('%c=== ROOM ===', 'color:#0ff; font-weight:bold;');
    console.log(`  Min: (${roomBox.min.x.toFixed(1)}, ${roomBox.min.y.toFixed(1)}, ${roomBox.min.z.toFixed(1)})`);
    console.log(`  Max: (${roomBox.max.x.toFixed(1)}, ${roomBox.max.y.toFixed(1)}, ${roomBox.max.z.toFixed(1)})`);

    // Scan all meshes for surfaces and table
    room.traverse((child) => {
        if (!child.isMesh) return;
        child.updateWorldMatrix(true, false);
        const wp = new THREE.Vector3();
        child.getWorldPosition(wp);
        const b = new THREE.Box3().setFromObject(child);
        const s = b.getSize(new THREE.Vector3());
        const name = (child.name || '').toLowerCase();

        // Detect table
        const isTable = name.includes('table') || name.includes('desk') || name.includes('stol');
        if (isTable && !tableInfo) {
            tableInfo = { mesh: child, position: wp.clone(), size: s.clone(), bounds: b.clone() };
        }

        // Detect any flat horizontal surface (for loot placement)
        // Wide/deep but not super tall
        if (s.x > 0.5 && s.z > 0.3 && s.y < 4.0 && s.y > 0.01 && b.max.y > 0.3) {
            surfaces.push({
                name: child.name,
                topY: b.max.y,
                bounds: b.clone(),
                center: wp.clone(),
                size: s.clone()
            });
        }

        console.log(`  "${child.name}" pos(${wp.x.toFixed(1)}, ${wp.y.toFixed(1)}, ${wp.z.toFixed(1)}) size(${s.x.toFixed(1)}, ${s.y.toFixed(1)}, ${s.z.toFixed(1)})${isTable ? ' ← TABLE' : ''}`);
    });

    // Fallback table detection
    if (!tableInfo && surfaces.length > 0) {
        let best = null, bestScore = 0;
        for (const s of surfaces) {
            const score = (s.size.x * s.size.z) / (s.size.y + 0.1);
            if (score > bestScore && s.size.y > 0.05) { bestScore = score; best = s; }
        }
        if (best) {
            tableInfo = { mesh: null, position: best.center, size: best.size, bounds: best.bounds };
            console.log(`%c🔍 Table guess: "${best.name}"`, 'color:#ff0;');
        }
    }

    if (tableInfo) {
        console.log(`%c✅ TABLE topY=${tableInfo.bounds.max.y.toFixed(2)}`, 'color:#0f0; font-size:14px;');
    }
    console.log(`%c📐 ${surfaces.length} surfaces found`, 'color:#0ff;');
}

// ===== CHAIR.GLB =====
function loadChair(scene) {
    const cloned = cloneModel('chair');
    if (!cloned) {
        console.warn('chair.glb not found!');
        return;
    }

    const chair = cloned.scene;

    // Position: right in front of the table
    let cx, cy, cz;
    if (tableInfo) {
        cx = tableInfo.position.x;
        cy = CONFIG.floorY;
        // In front = +Z side of table (toward camera)
        cz = tableInfo.bounds.max.z + 1.5;
    } else {
        cx = CONFIG.streamerPosition.x;
        cy = CONFIG.floorY;
        cz = CONFIG.streamerPosition.z;
    }

    // Scale: use murino-run pattern — measure, divide target by maxDim
    chair.scale.setScalar(1.0);
    chair.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(chair);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const targetHeight = CONFIG.chairSeatHeight * CONFIG.chairScale;
    const scaleFactor = maxDim > 0.01 ? targetHeight / maxDim : 1.0;
    chair.scale.setScalar(scaleFactor);

    // Ground: bottom on floor
    chair.updateMatrixWorld(true);
    const newBox = new THREE.Box3().setFromObject(chair);
    chair.position.set(cx, cy - newBox.min.y, cz);

    // Face the table (look toward -Z)
    chair.rotation.y = Math.PI;

    scene.add(chair);
    chairModel = chair;
    chairWorldPos = { x: cx, y: cy, z: cz };

    // Measure seat height for streamer
    chair.updateMatrixWorld(true);
    const finalBox = new THREE.Box3().setFromObject(chair);
    const seatY = finalBox.min.y + (finalBox.max.y - finalBox.min.y) * 0.4;
    chairWorldPos.seatY = seatY;

    console.log(`%c🪑 Chair at (${cx.toFixed(1)}, ${cy.toFixed(1)}, ${cz.toFixed(1)}) scale=${scaleFactor.toFixed(3)} seatY=${seatY.toFixed(2)}`, 'color:#fa0; font-weight:bold;');
}

// ===== LOOT — spread across the WHOLE room =====
function spawnLoot(scene) {
    const itemsGltf = loadedAssets.models['items'];
    if (!itemsGltf) { console.warn('items.glb not found!'); return; }

    // Measure items at scale 1
    const measureClone = itemsGltf.scene.clone(true);
    measureClone.scale.setScalar(1.0);
    measureClone.updateMatrixWorld(true);
    const itemBox = new THREE.Box3().setFromObject(measureClone);
    const itemSize = itemBox.getSize(new THREE.Vector3());

    // Fixed scale: items ~0.8 units tall (consistent, not random)
    const targetH = 0.8;
    const maxItemDim = Math.max(itemSize.x, itemSize.y, itemSize.z);
    const finalScale = maxItemDim > 0.01 ? targetH / maxItemDim : CONFIG.itemScale;

    console.log(`%c📦 Items: size(${itemSize.x.toFixed(2)}, ${itemSize.y.toFixed(2)}, ${itemSize.z.toFixed(2)}) scale=${finalScale.toFixed(3)}`, 'color:#f0f;');

    // Bottom offset at final scale
    const scaledClone = itemsGltf.scene.clone(true);
    scaledClone.scale.setScalar(finalScale);
    scaledClone.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(scaledClone);
    const bottomOffset = scaledBox.min.y;

    // ===== BUILD POSITIONS =====
    const positions = [];

    // 1. Items on EVERY surface found in the room
    for (const surf of surfaces) {
        const bx = surf.bounds;
        const topY = surf.topY + 0.02;
        const spanX = bx.max.x - bx.min.x;
        const spanZ = bx.max.z - bx.min.z;
        const area = spanX * spanZ;

        // 1-3 items per surface depending on size
        const count = Math.max(1, Math.min(3, Math.floor(area / 1.5)));
        for (let i = 0; i < count; i++) {
            const margin = 0.15;
            positions.push({
                x: bx.min.x + margin + Math.random() * Math.max(0.1, spanX - margin * 2),
                y: topY,
                z: bx.min.z + margin + Math.random() * Math.max(0.1, spanZ - margin * 2)
            });
        }
    }

    // 2. Extra items on the floor scattered around the room
    if (roomBounds) {
        const rb = roomBounds.box;
        const floorY = CONFIG.floorY + 0.02;
        for (let i = 0; i < 5; i++) {
            positions.push({
                x: rb.min.x + 1 + Math.random() * Math.max(1, roomBounds.size.x - 2),
                y: floorY,
                z: rb.min.z + 1 + Math.random() * Math.max(1, roomBounds.size.z - 2)
            });
        }
    }

    // 3. If we still have very few items, add some near hand start area
    if (positions.length < 5) {
        for (let i = 0; i < 6; i++) {
            positions.push({
                x: CONFIG.handStartX + (Math.random() - 0.5) * 12,
                y: CONFIG.floorY + 0.02,
                z: CONFIG.handStartZ + 5 + Math.random() * 15
            });
        }
    }

    // ===== SPAWN =====
    gameState.totalLoot = positions.length;

    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const clone = itemsGltf.scene.clone(true);
        clone.scale.setScalar(finalScale);

        // Ground: bottom of item sits on the surface
        const groundedY = pos.y - bottomOffset;
        clone.position.set(pos.x, groundedY, pos.z);
        clone.rotation.y = Math.random() * Math.PI * 2;

        clone.traverse((c) => {
            if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
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

    console.log(`%c🎁 ${positions.length} items across ${surfaces.length} surfaces + floor`, 'color:#0f0; font-weight:bold;');
}

export function updateLoot(deltaTime) {
    for (const loot of lootItems) {
        if (loot.userData.collected) continue;
        loot.userData.bobTimer += deltaTime * 2;
        loot.position.y = loot.userData.originalY + Math.sin(loot.userData.bobTimer) * 0.04;
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
        if (t < 1) requestAnimationFrame(animateCollect);
        else if (sceneRef) sceneRef.remove(lootItem);
    }
    animateCollect();
}
