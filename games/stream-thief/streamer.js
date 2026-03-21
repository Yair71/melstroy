// ============================================================
// streamer.js — Mel sits on a proper chair, swaps animations
// ============================================================
import { CONFIG, DEBUG } from './config.js';
import { loadedAssets } from './assets.js';
import { tableInfo } from './world.js';

const sittingModels = ['sit2', 'sit3', 'sitwait', 'sleepsit'];

let streamerGroup;
let chairGroup;
let mixer = null;
let currentKey = null;
let swapTimer = 3.0;
let seatWorldY = 0; // The Y coordinate of the top of the seat

export function initStreamer(scene) {
    // ===== DETERMINE CHAIR POSITION =====
    // If table found, place chair in front of the table
    // Otherwise use fallback from config
    let chairPos;
    if (tableInfo) {
        chairPos = {
            x: tableInfo.position.x,
            y: 0,   // chair stands on floor
            z: tableInfo.position.z + tableInfo.size.z / 2 + 1.5 // in front of table
        };
    } else {
        chairPos = {
            x: CONFIG.streamerPosition.x,
            y: CONFIG.streamerPosition.y,
            z: CONFIG.streamerPosition.z
        };
    }

    // ===== CREATE CHAIR =====
    chairGroup = createChair(CONFIG.chairScale);
    chairGroup.position.set(chairPos.x, chairPos.y, chairPos.z);
    scene.add(chairGroup);

    // Calculate exact seat top Y in world space
    seatWorldY = chairPos.y + CONFIG.chairSeatHeight * CONFIG.chairScale;

    // ===== STREAMER GROUP (sits on chair) =====
    streamerGroup = new THREE.Group();
    streamerGroup.position.set(chairPos.x, 0, chairPos.z);
    scene.add(streamerGroup);

    // Start with a random sitting model
    const startModel = sittingModels[Math.floor(Math.random() * sittingModels.length)];
    setModel(startModel);

    if (DEBUG) {
        // Yellow marker at chair position
        const m = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true })
        );
        m.position.set(chairPos.x, seatWorldY + 2, chairPos.z);
        scene.add(m);

        console.log('%c=== CHAIR & STREAMER ===', 'color: #ff0; font-weight: bold;');
        console.log(`  Chair at: (${chairPos.x.toFixed(2)}, ${chairPos.y.toFixed(2)}, ${chairPos.z.toFixed(2)})`);
        console.log(`  Seat top Y: ${seatWorldY.toFixed(2)}`);
        console.log(`  Chair scale: ${CONFIG.chairScale}`);
    }
}

function createChair(scale) {
    const chair = new THREE.Group();

    // Materials
    const frameMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.4,
        metalness: 0.6
    });
    const cushionMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.1
    });
    const accentMat = new THREE.MeshStandardMaterial({
        color: 0xcc0000,
        roughness: 0.6,
        metalness: 0.2
    });

    // Base/pedestal (5-star base)
    const baseCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15 * scale, 0.15 * scale, 1.2 * scale, 12),
        frameMat
    );
    baseCylinder.position.y = 0.6 * scale;
    baseCylinder.castShadow = true;
    chair.add(baseCylinder);

    // 5 legs radiating out
    for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5;
        const leg = new THREE.Mesh(
            new THREE.BoxGeometry(0.08 * scale, 0.06 * scale, 0.7 * scale),
            frameMat
        );
        leg.position.set(
            Math.sin(angle) * 0.35 * scale,
            0.03 * scale,
            Math.cos(angle) * 0.35 * scale
        );
        leg.rotation.y = -angle;
        leg.castShadow = true;
        chair.add(leg);

        // Wheel at end
        const wheel = new THREE.Mesh(
            new THREE.SphereGeometry(0.06 * scale, 8, 8),
            frameMat
        );
        wheel.position.set(
            Math.sin(angle) * 0.65 * scale,
            0.06 * scale,
            Math.cos(angle) * 0.65 * scale
        );
        chair.add(wheel);
    }

    // Seat cushion
    const seatH = CONFIG.chairSeatHeight * scale;
    const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.7 * scale, 0.12 * scale, 0.65 * scale),
        cushionMat
    );
    seat.position.y = seatH;
    seat.castShadow = true;
    chair.add(seat);

    // Backrest
    const backrest = new THREE.Mesh(
        new THREE.BoxGeometry(0.65 * scale, 1.0 * scale, 0.1 * scale),
        cushionMat
    );
    backrest.position.set(0, seatH + 0.55 * scale, -0.3 * scale);
    backrest.castShadow = true;
    chair.add(backrest);

    // Red accent stripe on backrest
    const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.15 * scale, 0.7 * scale, 0.11 * scale),
        accentMat
    );
    stripe.position.set(0, seatH + 0.55 * scale, -0.3 * scale);
    chair.add(stripe);

    // Armrests
    for (const side of [-1, 1]) {
        const armrest = new THREE.Mesh(
            new THREE.BoxGeometry(0.06 * scale, 0.06 * scale, 0.4 * scale),
            frameMat
        );
        armrest.position.set(side * 0.35 * scale, seatH + 0.3 * scale, -0.05 * scale);
        armrest.castShadow = true;
        chair.add(armrest);

        // Armrest support
        const support = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03 * scale, 0.03 * scale, 0.3 * scale, 8),
            frameMat
        );
        support.position.set(side * 0.35 * scale, seatH + 0.15 * scale, 0.1 * scale);
        chair.add(support);
    }

    return chair;
}

function setModel(modelKey) {
    if (currentKey === modelKey) return;
    if (mixer) mixer.stopAllAction();

    // Remove old model from group
    while (streamerGroup.children.length > 0) {
        streamerGroup.remove(streamerGroup.children[0]);
    }

    const gltf = loadedAssets.models[modelKey];
    if (!gltf) {
        console.warn(`Model "${modelKey}" not found in loaded assets`);
        return;
    }

    const clone = gltf.scene.clone(true);
    clone.scale.set(1, 1, 1);

    // Measure the model
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Scale model to a reasonable sitting height (~3 units from seat to head)
    const targetSittingHeight = 3.0;
    const modelScale = size.y > 0.01 ? targetSittingHeight / size.y : 1.0;
    clone.scale.setScalar(modelScale);

    // Recalculate after scaling
    clone.updateMatrixWorld(true);
    const newBox = new THREE.Box3().setFromObject(clone);

    // Position: center X/Z on chair, bottom of model at seat height
    clone.position.x = -center.x * modelScale;
    clone.position.z = -center.z * modelScale;
    clone.position.y = seatWorldY - newBox.min.y;

    // Face the model toward the table (toward -Z by default)
    clone.rotation.y = CONFIG.streamerRotationY;

    streamerGroup.add(clone);
    currentKey = modelKey;

    if (DEBUG) {
        console.log(`%c🧑 Streamer model: "${modelKey}" scale=${modelScale.toFixed(3)} seatY=${seatWorldY.toFixed(2)}`, 'color: #0ff;');
    }

    // Animations
    if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(clone);
        const action = mixer.clipAction(gltf.animations[0]);
        action.setLoop(THREE.LoopRepeat);
        action.play();
    } else {
        mixer = null;
    }
}

export function updateStreamer(deltaTime) {
    if (mixer) mixer.update(deltaTime);

    // Randomly swap sitting animations
    swapTimer -= deltaTime;
    if (swapTimer <= 0) {
        const available = sittingModels.filter(k => k !== currentKey);
        if (available.length > 0) {
            const pick = available[Math.floor(Math.random() * available.length)];
            setModel(pick);
        }
        swapTimer = 3.0 + Math.random() * 5.0;
    }
}
