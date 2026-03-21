import { CONFIG } from './config.js';
import { loadedAssets } from './assets.js';

const sittingModels = ['sit2', 'sit3', 'sitwait', 'sleepsit'];

// Single streamer slot - sits at the desk
let slot = null;
let swapTimer = 3.0;

export function initStreamer(scene) {
    // Create a group positioned at the desk (ONE fixed position)
    const group = new THREE.Group();
    group.position.set(
        CONFIG.streamerPosition.x,
        CONFIG.streamerPosition.y,
        CONFIG.streamerPosition.z
    );
    scene.add(group);

    // Pick a random starting animation
    const startKey = sittingModels[Math.floor(Math.random() * sittingModels.length)];

    slot = { group, currentKey: null, mixer: null, scene: scene };
    setModel(startKey);
}

function setModel(modelKey) {
    if (!slot || slot.currentKey === modelKey) return;

    // Clean up old
    if (slot.mixer) slot.mixer.stopAllAction();
    while (slot.group.children.length > 0) {
        slot.group.remove(slot.group.children[0]);
    }

    const gltf = loadedAssets.models[modelKey];
    if (!gltf) return;

    // Clone so we have our own instance
    const clone = gltf.scene.clone(true);
    clone.scale.set(1, 1, 1);

    // Face away from camera (toward the monitor/desk)
    clone.rotation.y = CONFIG.streamerRotationY;

    // Place model bottom on Y=0 of the group
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.x -= center.x;
    clone.position.z -= center.z;
    clone.position.y -= box.min.y; // Bottom sits on the surface

    slot.group.add(clone);
    slot.currentKey = modelKey;

    // Play animation if exists
    if (gltf.animations && gltf.animations.length > 0) {
        slot.mixer = new THREE.AnimationMixer(clone);
        const clip = gltf.animations[0];
        const action = slot.mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat);
        action.play();
    } else {
        slot.mixer = null;
    }
}

export function updateStreamer(deltaTime) {
    // Update animation mixer
    if (slot && slot.mixer) {
        slot.mixer.update(deltaTime);
    }

    // Random swap timer - swap to a different animation in the SAME position
    swapTimer -= deltaTime;
    if (swapTimer <= 0) {
        randomSwap();
        swapTimer = 3.0 + Math.random() * 5.0;
    }
}

function randomSwap() {
    if (!slot) return;

    // Pick a different animation than current
    const available = sittingModels.filter(k => k !== slot.currentKey);
    if (available.length === 0) return;

    const newKey = available[Math.floor(Math.random() * available.length)];
    setModel(newKey);
}
