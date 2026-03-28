// ============================================================
// streamer.js — Mel sits on chair in front of table
// Scaling: EXACT murino-run/player.js pattern
// ============================================================
import { CONFIG } from './config.js';
import { cloneModel } from './assets.js';
import { tableInfo, chairWorldPos } from './world.js';

const sittingModels = ['sit2', 'sit3', 'sitwait', 'sleepsit'];

let streamerGroup;
let mixer = null;
let currentAction = null;
let currentModelKey = null;

export function initStreamer(scene) {
    // Position: ON the chair, in front of the table
    let posX, posY, posZ;

    if (chairWorldPos) {
        // Sit on the chair — use the seat height we measured
        posX = chairWorldPos.x;
        posY = chairWorldPos.seatY || (CONFIG.floorY + CONFIG.chairSeatHeight);
        posZ = chairWorldPos.z;
    } else if (tableInfo) {
        // Fallback: in front of table
        posX = tableInfo.position.x;
        posY = CONFIG.floorY + CONFIG.chairSeatHeight;
        posZ = tableInfo.bounds.max.z + 1.5;
    } else {
        posX = CONFIG.streamerPosition.x;
        posY = CONFIG.streamerPosition.y;
        posZ = CONFIG.streamerPosition.z;
    }

    streamerGroup = new THREE.Group();
    streamerGroup.position.set(posX, posY, posZ);
    scene.add(streamerGroup);

    const start = sittingModels[Math.floor(Math.random() * sittingModels.length)];
    switchModel(start);

    console.log(`%c🧑 Streamer at (${posX.toFixed(1)}, ${posY.toFixed(1)}, ${posZ.toFixed(1)})`, 'color:#0ff; font-weight:bold;');
}

// ===== switchModel — EXACT murino-run/player.js pattern =====
function switchModel(modelKey) {
    if (currentModelKey === modelKey) return;
    if (mixer) mixer.stopAllAction();

    while (streamerGroup.children.length > 0) {
        streamerGroup.remove(streamerGroup.children[0]);
    }

    const cloned = cloneModel(modelKey);
    if (!cloned) {
        console.warn(`Model "${modelKey}" not found!`);
        return;
    }

    const modelScene = cloned.scene;

    // ===== MURINO-RUN PATTERN: step by step =====

    // 1. Reset
    modelScene.scale.set(1, 1, 1);
    modelScene.position.set(0, 0, 0);

    // 2. Rotation: face the table (table is in -Z from chair)
    modelScene.rotation.y = Math.PI;

    // 3. Update matrix BEFORE measuring
    modelScene.updateMatrixWorld(true);

    // 4. Measure bounding box
    const box = new THREE.Box3().setFromObject(modelScene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // 5. Scale: modelHeight / maxDim (EXACTLY like murino-run)
    if (maxDim > 0) {
        const scaleFactor = CONFIG.modelHeight / maxDim;
        modelScene.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // 6. Re-measure after scaling
        modelScene.updateMatrixWorld(true);
        const newBox = new THREE.Box3().setFromObject(modelScene);

        // 7. Ground: bottom at Y=0 of the group
        modelScene.position.y = 0 - newBox.min.y;
    }

    // 8. Add to group
    streamerGroup.add(modelScene);
    currentModelKey = modelKey;

    // 9. Animation (exact murino-run pattern)
    if (cloned.animations && cloned.animations.length > 0) {
        const clip = cloned.animations[0].clone();

        // Filter out position tracks
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
