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
  
  // Ставим Мела на высоту сиденья стула
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

  // Сброс позиции перед расчетами
  gltf.scene.scale.set(1, 1, 1);
  gltf.scene.position.set(0, 0, 0);
  
  // Поворачиваем спиной к камере (чтобы смотрел на мониторы/стол)
  gltf.scene.rotation.y = Math.PI; 
  gltf.scene.updateMatrixWorld(true);

  // 1. Подгоняем масштаб (как в murino-run)
  const box = new THREE.Box3().setFromObject(gltf.scene);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  if (maxDim > 0) {
    const scaleFactor = CONFIG.streamerHeight / maxDim;
    gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
    gltf.scene.updateMatrixWorld(true);

    // 2. Идеальное центрирование (чтобы не прыгали)
    const newBox = new THREE.Box3().setFromObject(gltf.scene);
    const center = newBox.getCenter(new THREE.Vector3());
    
    // Смещаем модельку так, чтобы ее центр по X и Z был ровно в нуле,
    // а нижняя точка (попа) сидела ровно на Y = 0 группы (то есть на сиденье)
    gltf.scene.position.x -= center.x;
    gltf.scene.position.z -= center.z;
    gltf.scene.position.y += (0 - newBox.min.y);
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

  // Каждые 3-6 секунд рандомно меняем позу, чтобы Мел был живым
  cycleTimer -= deltaTime;
  if (cycleTimer <= 0) {
    const randomModel = sittingModels[Math.floor(Math.random() * sittingModels.length)];
    switchModel(randomModel);
    cycleTimer = 3.0 + Math.random() * 3.0; 
  }
}
