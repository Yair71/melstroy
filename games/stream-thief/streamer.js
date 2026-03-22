// ============================================================
// streamer.js — Mel sits on chair. 
// Model code COPIED FROM murino-run/player.js (the WORKING code)
// Key pattern: gltf.scene directly, scaleFactor = modelHeight / maxDim,
// position.y = -newBox.min.y, mixer on gltf.scene
// ============================================================
import { CONFIG, DEBUG } from './config.js';
import { loadedAssets } from './assets.js';
import { tableInfo } from './world.js';

const sittingModels = ['sit2', 'sit3', 'sitwait', 'sleepsit'];

let streamerGroup;
let chairGroup;
let mixer = null;
let currentAction = null;
let currentModelKey = null;
let seatWorldY = 0;

export function initStreamer(scene) {
    // ===== CHAIR POSITION =====
    let chairPos;
    if (tableInfo) {
        chairPos = {
            x: tableInfo.position.x,
            y: 0,
            z: tableInfo.position.z + tableInfo.size.z / 2 + 2.0
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

    seatWorldY = chairPos.y + CONFIG.chairSeatHeight * CONFIG.chairScale;

    // ===== STREAMER GROUP =====
    streamerGroup = new THREE.Group();
    streamerGroup.position.set(chairPos.x, seatWorldY, chairPos.z);
    scene.add(streamerGroup);

    // Start with random model
    const start = sittingModels[Math.floor(Math.random() * sittingModels.length)];
    switchModel(start);

    if (DEBUG) {
        const m = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true })
        );
        m.position.set(chairPos.x, seatWorldY + 3, chairPos.z);
        scene.add(m);
        console.log('%c=== CHAIR & STREAMER ===', 'color:#ff0; font-weight:bold;');
        console.log(`  Chair: (${chairPos.x.toFixed(2)}, ${chairPos.y.toFixed(2)}, ${chairPos.z.toFixed(2)})`);
        console.log(`  Seat Y: ${seatWorldY.toFixed(2)}`);
    }
}

// ===== switchModel — EXACT COPY of murino-run/player.js pattern =====
function switchModel(modelKey) {
    if (currentModelKey === modelKey) return;
    if (mixer) mixer.stopAllAction();

    // Remove old children
    while (streamerGroup.children.length > 0) {
        streamerGroup.remove(streamerGroup.children[0]);
    }

    const gltf = loadedAssets.models[modelKey];
    if (!gltf) {
        console.warn(`Model "${modelKey}" not found!`);
        return;
    }

    // ===== EXACTLY like murino-run/player.js: =====
    // 1. Reset scale and position
    gltf.scene.scale.set(1, 1, 1);
    gltf.scene.position.set(0, 0, 0);

    // 2. Rotation: sitting models face -Z (toward table)
    gltf.scene.rotation.y = Math.PI;

    // 3. Measure and scale
    gltf.scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    if (maxDim > 0) {
        const scaleFactor = CONFIG.modelHeight / maxDim;
        gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
        gltf.scene.updateMatrixWorld(true);

        // 4. Ground the model: bottom sits at Y=0 of the group
        const newBox = new THREE.Box3().setFromObject(gltf.scene);
        gltf.scene.position.y = 0 - newBox.min.y;
    }

    streamerGroup.add(gltf.scene);
    currentModelKey = modelKey;

    // 5. Animation — EXACTLY like murino-run
    if (gltf.animations && gltf.animations.length > 0) {
        const clip = gltf.animations[0];

        // Filter out position tracks (sitting animations might have root motion)
        clip.tracks = clip.tracks.filter(track =>
            !track.name.toLowerCase().includes('position')
        );

        mixer = new THREE.AnimationMixer(gltf.scene);
        currentAction = mixer.clipAction(clip);
        currentAction.setLoop(THREE.LoopRepeat);
        currentAction.play();
    } else {
        mixer = null;
        currentAction = null;
    }

    if (DEBUG) {
        console.log(`%c🧑 Model "${modelKey}" loaded. Scale=${(CONFIG.modelHeight / maxDim).toFixed(3)} Height=${CONFIG.modelHeight}`, 'color:#0ff;');
    }
}

// ===== GAMING CHAIR =====
function createChair(scale) {
    const chair = new THREE.Group();

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.6 });
    const cushionMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.1 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6, metalness: 0.2 });

    // Central column
    const column = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12 * scale, 0.12 * scale, CONFIG.chairSeatHeight * scale, 12),
        frameMat
    );
    column.position.y = (CONFIG.chairSeatHeight * scale) / 2;
    column.castShadow = true;
    chair.add(column);

    // 5-star base
    for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5;
        const leg = new THREE.Mesh(
            new THREE.BoxGeometry(0.08 * scale, 0.06 * scale, 0.8 * scale),
            frameMat
        );
        leg.position.set(Math.sin(angle) * 0.4 * scale, 0.03 * scale, Math.cos(angle) * 0.4 * scale);
        leg.rotation.y = -angle;
        leg.castShadow = true;
        chair.add(leg);

        // Wheels
        const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.07 * scale, 8, 8), frameMat);
        wheel.position.set(Math.sin(angle) * 0.75 * scale, 0.07 * scale, Math.cos(angle) * 0.75 * scale);
        chair.add(wheel);
    }

    // Seat
    const seatH = CONFIG.chairSeatHeight * scale;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 0.12 * scale, 0.7 * scale), cushionMat);
    seat.position.y = seatH;
    seat.castShadow = true;
    chair.add(seat);

    // Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.75 * scale, 1.2 * scale, 0.1 * scale), cushionMat);
    back.position.set(0, seatH + 0.65 * scale, -0.32 * scale);
    back.castShadow = true;
    chair.add(back);

    // Red stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.2 * scale, 0.9 * scale, 0.11 * scale), accentMat);
    stripe.position.set(0, seatH + 0.65 * scale, -0.32 * scale);
    chair.add(stripe);

    // Armrests
    for (const side of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.07 * scale, 0.07 * scale, 0.45 * scale), frameMat);
        arm.position.set(side * 0.4 * scale, seatH + 0.35 * scale, -0.05 * scale);
        arm.castShadow = true;
        chair.add(arm);

        const support = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03 * scale, 0.03 * scale, 0.35 * scale, 8),
            frameMat
        );
        support.position.set(side * 0.4 * scale, seatH + 0.17 * scale, 0.1 * scale);
        chair.add(support);
    }

    // Headrest
    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.4 * scale, 0.25 * scale, 0.08 * scale), cushionMat);
    headrest.position.set(0, seatH + 1.35 * scale, -0.32 * scale);
    chair.add(headrest);

    return chair;
}

let swapTimer = 4.0;

export function updateStreamer(deltaTime) {
    if (mixer) mixer.update(deltaTime);

    swapTimer -= deltaTime;
    if (swapTimer <= 0) {
        const available = sittingModels.filter(k => k !== currentModelKey);
        if (available.length > 0) {
            switchModel(available[Math.floor(Math.random() * available.length)]);
        }
        swapTimer = 4.0 + Math.random() * 6.0;
    }
}
