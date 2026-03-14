import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { loadedAssets } from './assets.js';
import { spawnCrater } from './obstacles.js';

export let playerGroup;
let mixer;
let currentAction;
let currentModelKey = null;

export function initPlayer(scene) {
  playerGroup = new THREE.Group();
  playerGroup.position.set(CONFIG.lanes[1], CONFIG.playerYOffset, 0);
  scene.add(playerGroup);

  const dances = ['dance1', 'dance2'];
  switchModel(dances[Math.floor(Math.random() * dances.length)]);
  return playerGroup;
}

export function switchModel(modelKey) {
  if (currentModelKey === modelKey) return;
  if (mixer) mixer.stopAllAction();

  while (playerGroup.children.length > 0) {
    playerGroup.remove(playerGroup.children[0]);
  }

  const gltf = loadedAssets.models[modelKey];
  if (!gltf) return;

  gltf.scene.scale.set(1, 1, 1);
  gltf.scene.position.set(0, 0, 0);

  if (modelKey.includes('dance')) {
    gltf.scene.rotation.y = -Math.PI / 2;
  } else {
    gltf.scene.rotation.y = Math.PI;
  }

  gltf.scene.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(gltf.scene);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  if (maxDim > 0) {
    let scaleFactor = CONFIG.modelHeight / maxDim;
    if (modelKey === 'jump') scaleFactor *= 1.2;

    gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
    gltf.scene.updateMatrixWorld(true);

    const newBox = new THREE.Box3().setFromObject(gltf.scene);
    gltf.scene.position.y = 0 - newBox.min.y;

    if (modelKey === 'fall') {
      gltf.scene.position.y += 0.2;
    }
  }

  playerGroup.add(gltf.scene);
  currentModelKey = modelKey;

  if (gltf.animations && gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(gltf.scene);
    currentAction = mixer.clipAction(gltf.animations[0]);

    if (modelKey === 'fall' || modelKey === 'jump') {
      currentAction.setLoop(THREE.LoopOnce);
      currentAction.clampWhenFinished = true;
    } else {
      currentAction.setLoop(THREE.LoopRepeat);
    }
    currentAction.play();
  }
}

export function updatePlayer(deltaTime) {
  if (!playerGroup) return;
  if (mixer) mixer.update(deltaTime);

  if (gameState.current === STATE.INTRO) {
    playerGroup.position.x = CONFIG.roadWidth / 2 - 1.5;
    playerGroup.position.y = CONFIG.playerYOffset;
    return;
  }

  if (gameState.current === STATE.DYING) return;

  const lerpSpeed = 10;
  playerGroup.position.x += (gameState.targetX - playerGroup.position.x) * lerpSpeed * deltaTime;

  if (gameState.isJumping) {
    gameState.velocityY += CONFIG.gravity;
    playerGroup.position.y += gameState.velocityY;

    if (playerGroup.position.y <= CONFIG.playerYOffset) {
      playerGroup.position.y = CONFIG.playerYOffset;
      gameState.isJumping = false;
      gameState.velocityY = 0;

      // Landing crack — looks like the character is heavy
      spawnCrater(playerGroup.position.x, playerGroup.position.z);

      if (gameState.current === STATE.PLAYING) {
        switchModel('run');
      }
    }
  } else {
    playerGroup.position.y = CONFIG.playerYOffset;
  }
}
