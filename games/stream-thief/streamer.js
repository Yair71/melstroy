// ============================================================
// streamer.js — Mel sits on chair (chair.glb from world.js)
// FIXED: uses cloneModel() to avoid Three.js singleton bug
// ============================================================
import { CONFIG } from './config.js';
import { cloneModel } from './assets.js';
import { tableInfo, chairModel } from './world.js';

const sittingModels = ['sit2', 'sit3', 'sitwait', 'sleepsit'];

let streamerGroup;
let mixer = null;
let currentAction = null;
let currentModelKey = null;
let seatWorldY = 0;

export function initStreamer(scene) {
    // ===== POSITION: near the chair or table =====
    let chairPos;
    if (chairModel) {
        // Place streamer at the chair's position
        chairModel.updateMatrixWorld(true);
        const chairBox = new THREE.Box3().setFromObject(chairModel);
        const chairCenter = chairBox.getCenter(new THREE.Vector3());
        chairPos = {
            x: chairCenter.x,
            y: CONFIG.floorY,
            z: chairCenter.z
        };
        // Seat height = top of the chair seat area (roughly 40-50% of chair height)
        seatWorldY = chairBox.min.y + (chairBox.max.y - chairBox.min.y) * 0.35;
    } else if (tableInfo) {
        chairPos = {
            x: tableInfo.position.x,
            y: CONFIG.floorY,
            z: tableInfo.position.z + tableInfo.size.z / 2 + 2.0
        };
        seatWorldY = CONFIG.floorY + CONFIG.chairSeatHeight * CONFIG.chairScale;
    } else {
        chairPos = {
            x: CONFIG.streamerPosition.x,
            y: CONFIG.streamerPosition.y,
            z: CONFIG.streamerPosition.z
        };
        seatWorldY = CONFIG.floorY + CONFIG.chairSeatHeight * CONFIG.chairScale;
    }

    // ===== STREAMER GROUP =====
    streamerGroup = new THREE.Group();
    streamerGroup.position.set(chairPos.x, seatWorldY, chairPos.z);
    scene.add(streamerGroup);

    // Start with random sitting animation
    const start = sittingModels[Math.floor(Math.random() * sittingModels.length)];
    switchModel(start);

    console.log(`%c🧑 Streamer at (${chairPos.x.toFixed(1)}, ${seatWorldY.toFixed(1)}, ${chairPos.z.toFixed(1)})`, 'color:#0ff; font-weight:bold;');
}

// ===== switchModel — uses cloneModel() to avoid singleton bug =====
function switchModel(modelKey) {
    if (currentModelKey === modelKey) return;
    if (mixer) mixer.stopAllAction();

    // Remove old children
    while (streamerGroup.children.length > 0) {
        streamerGroup.remove(streamerGroup.children[0]);
    }

    // CRITICAL: clone the model, don't use gltf.scene directly!
    const cloned = cloneModel(modelKey);
    if (!cloned) {
        console.warn(`Model "${modelKey}" not found!`);
        return;
    }

    const modelScene = cloned.scene;

    // 1. Reset scale and position
    modelScene.scale.set(1, 1, 1);
    modelScene.position.set(0, 0, 0);

    // 2. Face toward table (-Z direction)
    modelScene.rotation.y = Math.PI;

    // 3. Measure and scale to modelHeight
    modelScene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(modelScene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    if (maxDim > 0) {
        const scaleFactor = CONFIG.modelHeight / maxDim;
        modelScene.scale.set(scaleFactor, scaleFactor, scaleFactor);
        modelScene.updateMatrixWorld(true);

        // Ground the model: bottom sits at Y=0 of the group
        const newBox = new THREE.Box3().setFromObject(modelScene);
        modelScene.position.y = 0 - newBox.min.y;
    }

    streamerGroup.add(modelScene);
    currentModelKey = modelKey;

    // 4. Animation
    if (cloned.animations && cloned.animations.length > 0) {
        const clip = cloned.animations[0].clone();

        // Filter out position tracks (sitting animations have root motion)
        clip.tracks = clip.tracks.filter(track =>
            !track.name.toLowerCase().includes('position')
        );

        mixer = new THREE.AnimationMixer(modelScene);
        currentAction = mixer.clipAction(clip);
        currentAction.setLoop(THREE.LoopRepeat);
        currentAction.play();
    } else {
        mixer = null;
        currentAction = null;
    }
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
