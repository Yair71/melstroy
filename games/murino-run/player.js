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
    const scaleFactor = CONFIG.modelHeight / maxDim;
    gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
    gltf.scene.updateMatrixWorld(true);

    const newBox = new THREE.Box3().setFromObject(gltf.scene);
    gltf.scene.position.y = 0 - newBox.min.y;

    if (modelKey === 'fall') {
      gltf.scene.position.y += 0.3;
    }
  }

  playerGroup.add(gltf.scene);
  currentModelKey = modelKey;

  if (gltf.animations && gltf.animations.length > 0) {
    const clip = gltf.animations[0];

    if (modelKey === 'jump' || modelKey === 'fall') {
      clip.tracks = clip.tracks.filter(track => !track.name.toLowerCase().includes('position'));
    }

    mixer = new THREE.AnimationMixer(gltf.scene);
    currentAction = mixer.clipAction(clip);

    if (modelKey === 'fall' || modelKey === 'jump') {
      currentAction.setLoop(THREE.LoopOnce);
      currentAction.clampWhenFinished = true;
    } else {
      currentAction.setLoop(THREE.LoopRepeat);
    }

    currentAction.play();
  }
}

export function setPlayerVisibility(isVisible) {
  if (playerGroup) {
    playerGroup.visible = isVisible;
  }
}

export function updatePlayer(deltaTime) {
  if (!playerGroup) return;
  if (mixer) mixer.update(deltaTime);

  if (gameState.current === STATE.INTRO) {
    playerGroup.position.x = CONFIG.roadWidth / 2 - 1.5;
    playerGroup.position.y = CONFIG.playerYOffset;
    playerGroup.position.z = 0; 
    return;
  }

  if (gameState.current === STATE.DYING) {
    // 1. Физика отскока от стены
    if (gameState.deathPushVelocity > 0) {
      playerGroup.position.z += gameState.deathPushVelocity * deltaTime;
      gameState.deathPushVelocity -= 30 * deltaTime; // Быстрое торможение в воздухе
      if (gameState.deathPushVelocity < 0) gameState.deathPushVelocity = 0;
    }

    // 2. Гравитация трупа (всегда падает камнем вниз до земли)
    if (playerGroup.position.y > gameState.deathTargetY) {
      playerGroup.position.y -= 14 * deltaTime;
      if (playerGroup.position.y < gameState.deathTargetY) {
        playerGroup.position.y = gameState.deathTargetY;
      }
    }
    return;
  }

  // Во время игры Z всегда строго 0
  playerGroup.position.z = 0;

  const lerpSpeed = 10;
  playerGroup.position.x += (gameState.targetX - playerGroup.position.x) * lerpSpeed * deltaTime;

  if (gameState.isJumping) {
    gameState.jumpTimer += deltaTime;
    const progress = gameState.jumpTimer / CONFIG.jumpDuration;

    if (progress >= 1.0) {
      playerGroup.position.y = CONFIG.playerYOffset;
      gameState.isJumping = false;
      gameState.jumpTimer = 0;

      spawnCrater(playerGroup.position.x, playerGroup.position.z, 1.0, false);

      if (gameState.current === STATE.PLAYING) {
        switchModel('run');
      }
    } else {
      playerGroup.position.y = CONFIG.playerYOffset + Math.sin(progress * Math.PI) * CONFIG.jumpHeight;
    }
  } else {
    playerGroup.position.y = CONFIG.playerYOffset;
  }
}
