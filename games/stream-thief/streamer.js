import { CONFIG } from './config.js';
import { loadedAssets } from './assets.js';
import { chairs } from './world.js';
 const sittingModels = ['sit2', 'sit3', 'sitwait', 'sleepsit'];
// Each chair slot: { group, currentKey, mixer }
const slots = [];
let swapTimer = 3.0;
 
export function initStreamer(scene) {
      // Wait for chairs to be created in world.js, assign one model per chair
    const shuffled = shuffleArray([...sittingModels]);
 
    for (let i = 0; i < chairs.length; i++) {
        const chair = chairs[i];
        const group = new THREE.Group();
        // Position the model on the chair seat
        group.position.set(
            chair.position.x,
            CONFIG.chairSeatHeight,
            chair.position.z
        );
        scene.add(group);
          const modelKey = shuffled[i % shuffled.length];
        const slot = { group, currentKey: null, mixer: null };
        slots.push(slot);
 
        setModelOnSlot(slot, modelKey);
    }
}
function setModelOnSlot(slot, modelKey) {
    if (slot.currentKey === modelKey) return;
   // Clean up old
    if (slot.mixer) slot.mixer.stopAllAction();
    while (slot.group.children.length > 0) {
        slot.group.remove(slot.group.children[0]);
    }
 
    const gltf = loadedAssets.models[modelKey];
    if (!gltf) return;
     // Clone the scene so each slot has its own instance
    const clone = gltf.scene.clone(true);
    clone.scale.set(1, 1, 1);
    clone.rotation.y = Math.PI; // Face toward camera
  // Place model bottom on Y=0 of the group (which is at seat height)
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clone);
    clone.position.x -= box.getCenter(new THREE.Vector3()).x;
    clone.position.z -= box.getCenter(new THREE.Vector3()).z;
    clone.position.y -= box.min.y; // Bottom of model sits on chair
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
     // Update all animation mixers
    for (const slot of slots) {
        if (slot.mixer) slot.mixer.update(deltaTime);
    }
 
    // Random swap timer
    swapTimer -= deltaTime;
    if (swapTimer <= 0) {
        randomSwap();
        swapTimer = 3.0 + Math.random() * 4.0;
    }
}
 
function randomSwap() {
    if (slots.length < 2) return;
 
    // Pick two different slots and swap their models
    const a = Math.floor(Math.random() * slots.length);
    let b = Math.floor(Math.random() * slots.length);
    while (b === a) b = Math.floor(Math.random() * slots.length);
 
    const keyA = slots[a].currentKey;
    const keyB = slots[b].currentKey;
 
    setModelOnSlot(slots[a], keyB);
    setModelOnSlot(slots[b], keyA);
}
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
