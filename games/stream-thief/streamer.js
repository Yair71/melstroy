// games/stream-thief/streamer.js
import { CONFIG } from './config.js';
import { loadedAssets } from './assets.js';

export let streamerGroup;
let mixer;
let currentModelKey = null;
let cycleTimer = 0;

const sittingModels = ['sit2', 'sit3', 'sitwait', 'sleepsit'];

export function initStreamer(scene) {
  streamerGroup = new THREE.Group();
  
  // Мел сидит ровно на высоте сиденья
  streamerGroup.position.set(0, CONFIG.seatHeight, CONFIG.streamerZ); 
  scene.add(streamerGroup);

  switchModel('sleepsit'); 
  return streamerGroup;
}

export function switchModel(modelKey) {
  if (currentModelKey === modelKey) return;
  if (mixer) mixer.stopAllAction();

  while (streamerGroup.children.length > 0) {
    streamerGroup.remove(streamerGroup.children[0]);
  }

  const gltf = loadedAssets.models[modelKey];
  if (!gltf) return;

  gltf.scene.scale.set(1, 1, 1);
  gltf.scene.position.set(0, 0, 0);
  
  // Спиной к нам, лицом к столу
  gltf.scene.rotation.y = Math.PI; 
  gltf.scene.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(gltf.scene);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  if (maxDim > 0) {
    const scaleFactor = CONFIG.streamerHeight / maxDim;
    gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
    gltf.scene.updateMatrixWorld(true);

    // ПОДГОНЯЕМ ТОЛЬКО ВЫСОТУ (Y). X и Z не трогаем, чтобы не прыгал!
    const newBox = new THREE.Box3().setFromObject(gltf.scene);
    gltf.scene.position.y = 0 - newBox.min.y;
  }

  streamerGroup.add(gltf.scene);
  currentModelKey = modelKey;

  if (gltf.animations && gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(gltf.scene);
    const action = mixer.clipAction(gltf.animations[0]);
    action.setLoop(THREE.LoopRepeat);
    action.play();
  }
}

export function updateStreamer(deltaTime) {
  if (mixer) mixer.update(deltaTime);

  cycleTimer -= deltaTime;
  if (cycleTimer <= 0) {
    const randomModel = sittingModels[Math.floor(Math.random() * sittingModels.length)];
    switchModel(randomModel);
    cycleTimer = 3.0 + Math.random() * 3.0; 
  }
}
