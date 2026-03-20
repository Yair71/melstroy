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
  
  // Ставим Мела на кресло
  streamerGroup.position.set(0, CONFIG.seatHeight + CONFIG.streamerY, CONFIG.streamerZ); 
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

  // ЖЕСТКИЙ МАСШТАБ. БОЛЬШЕ НИКАКОЙ АВТО-ПОДГОНКИ!
  gltf.scene.scale.set(CONFIG.streamerScale, CONFIG.streamerScale, CONFIG.streamerScale);
  gltf.scene.position.set(0, 0, 0);
  
  // Спиной к нам, лицом к столу
  gltf.scene.rotation.y = Math.PI; 

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
