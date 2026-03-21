import { CONFIG } from './config.js';
import { loadedAssets } from './assets.js';

const sittingModels = ['sit2', 'sit3', 'sitwait', 'sleepsit'];

let slot = null;
let swapTimer = 3.0;

export function initStreamer(scene) {
    const group = new THREE.Group();
    group.position.set(
        CONFIG.streamerPosition.x,
        CONFIG.streamerPosition.y,
        CONFIG.streamerPosition.z
    );
    scene.add(group);

    const startKey = sittingModels[Math.floor(Math.random() * sittingModels.length)];
    slot = { group, currentKey: null, mixer: null };
    setModel(startKey);

    if (CONFIG.debug) {
        // Debug marker for streamer position
        const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true })
        );
        marker.position.copy(group.position);
        marker.position.y += 1;
        scene.add(marker);
        console.log(`Streamer position: (${group.position.x}, ${group.position.y}, ${group.position.z})`);
    }
}

function setModel(modelKey) {
    if (!slot || slot.currentKey === modelKey) return;

    if (slot.mixer) slot.mixer.stopAllAction();
    while (slot.group.children.length > 0) {
        slot.group.remove(slot.group.children[0]);
    }

    const gltf = loadedAssets.models[modelKey];
    if (!gltf) return;

    const clone = gltf.scene.clone(true);
    clone.scale.set(1, 1, 1);
    clone.rotation.y = CONFIG.streamerRotationY;

    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.x -= center.x;
    clone.position.z -= center.z;
    clone.position.y -= box.min.y;

    slot.group.add(clone);
    slot.currentKey = modelKey;

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
    if (slot && slot.mixer) {
        slot.mixer.update(deltaTime);
    }

    swapTimer -= deltaTime;
    if (swapTimer <= 0) {
        randomSwap();
        swapTimer = 3.0 + Math.random() * 5.0;
    }
}

function randomSwap() {
    if (!slot) return;
    const available = sittingModels.filter(k => k !== slot.currentKey);
    if (available.length === 0) return;
    const newKey = available[Math.floor(Math.random() * available.length)];
    setModel(newKey);
}
