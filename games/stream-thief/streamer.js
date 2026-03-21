import { CONFIG } from './config.js';
import { loadedAssets } from './assets.js';
const sittingModels = ['sit2', 'sit3', 'sitwait', 'sleepsit'];
let slot = null; let swapTimer = 3.0;
export function initStreamer(scene) {
    const group = new THREE.Group();
    group.position.set(CONFIG.streamerPosition.x, CONFIG.streamerPosition.y, CONFIG.streamerPosition.z);
    scene.add(group);
    slot = { group, currentKey: null, mixer: null };
    setModel(sittingModels[Math.floor(Math.random() * sittingModels.length)]);
    if (CONFIG.debug) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.3,8,8), new THREE.MeshBasicMaterial({color:0x00ffff,wireframe:true}));
        m.position.copy(group.position); m.position.y += 1; scene.add(m);
    }
}
function setModel(modelKey) {
    if (!slot || slot.currentKey === modelKey) return;
    if (slot.mixer) slot.mixer.stopAllAction();
    while (slot.group.children.length > 0) slot.group.remove(slot.group.children[0]);
    const gltf = loadedAssets.models[modelKey]; if (!gltf) return;
    const clone = gltf.scene.clone(true); clone.scale.set(1,1,1); clone.rotation.y = CONFIG.streamerRotationY;
    clone.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(clone); const c = box.getCenter(new THREE.Vector3());
    clone.position.x -= c.x; clone.position.z -= c.z; clone.position.y -= box.min.y;
    slot.group.add(clone); slot.currentKey = modelKey;
    if (gltf.animations && gltf.animations.length > 0) {
        slot.mixer = new THREE.AnimationMixer(clone); const a = slot.mixer.clipAction(gltf.animations[0]); a.setLoop(THREE.LoopRepeat); a.play();
    } else { slot.mixer = null; }
}
export function updateStreamer(dt) {
    if (slot && slot.mixer) slot.mixer.update(dt);
    swapTimer -= dt;
    if (swapTimer <= 0) {
        const avail = sittingModels.filter(k => k !== (slot ? slot.currentKey : ''));
        if (avail.length > 0) setModel(avail[Math.floor(Math.random() * avail.length)]);
        swapTimer = 3.0 + Math.random() * 5.0;
    }
}
