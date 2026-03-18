// games/stream-thief/streamer.js
import { CONFIG, STREAMER_STATE } from './config.js';
import { gameState } from './gameState.js';
import { loadedAssets } from './assets.js';

export let streamerGroup;
let mixer;
let currentModelKey = null;

export function initStreamer(scene) {
  streamerGroup = new THREE.Group();
  
  // Ставим Мела ЗА стол (стол кончается на z: -5.5).
  // Высота сиденья стула - 1.8.
  streamerGroup.position.set(0, CONFIG.streamerYOffset, -6.5); 
  scene.add(streamerGroup);

  switchModel('sleepsit'); // Стартовая анимация
  return streamerGroup;
}

export function switchModel(modelKey) {
  if (currentModelKey === modelKey) return;
  if (mixer) mixer.stopAllAction();

  // Удаляем старую модель
  while (streamerGroup.children.length > 0) {
    streamerGroup.remove(streamerGroup.children[0]);
  }

  const gltf = loadedAssets.models[modelKey];
  if (!gltf) return;

  gltf.scene.scale.set(1, 1, 1);
  gltf.scene.position.set(0, 0, 0);
  
  // Поворачиваем Мела лицом к камере (и столу)
  gltf.scene.rotation.y = 0; 
  gltf.scene.updateMatrixWorld(true);

  // Идеальная подгонка размера из murino-run
  const box = new THREE.Box3().setFromObject(gltf.scene);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  if (maxDim > 0) {
    const scaleFactor = CONFIG.streamerHeight / maxDim;
    gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
    gltf.scene.updateMatrixWorld(true);

    const newBox = new THREE.Box3().setFromObject(gltf.scene);
    // Выравниваем нижнюю точку модельки (попу/ноги) ровно по сиденью
    gltf.scene.position.y = 0 - newBox.min.y;
  }

  streamerGroup.add(gltf.scene);
  currentModelKey = modelKey;

  // Запускаем встроенную анимацию
  if (gltf.animations && gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(gltf.scene);
    const action = mixer.clipAction(gltf.animations[0]);
    action.setLoop(THREE.LoopRepeat);
    action.play();
  }
}

export function updateStreamer(deltaTime) {
  if (mixer) mixer.update(deltaTime);

  // Меняем модель в зависимости от фазы стримера
  if (gameState.streamerState === STREAMER_STATE.SLEEPING) {
    switchModel('sleepsit');
  } else if (gameState.streamerState === STREAMER_STATE.WARNING) {
    switchModel('sitwait');
  } else if (gameState.streamerState === STREAMER_STATE.AWAKE) {
    // Рандомизируем, сидит он обычно (sit2) или иначе (sit3)
    switchModel(Math.random() > 0.5 ? 'sit2' : 'sit3');
  }
}
