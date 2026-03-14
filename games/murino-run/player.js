import { CONFIG, STATE, ASSETS } from './config.js';
import { gameState } from './gameState.js';
import { loadedAssets } from './assets.js';
import { spawnCrater } from './obstacles.js';

export let playerGroup;

let mixer;
let currentAction;
let currentModelKey = null;

let currentVisualRoot = null;
let currentVisualOffsetY = 0;

let faceVideoEl = null;
let faceVideoTexture = null;
let faceVideoMesh = null;

export function initPlayer(scene) {
  playerGroup = new THREE.Group();
  playerGroup.position.set(CONFIG.lanes[1], CONFIG.playerYOffset, 0);
  scene.add(playerGroup);

  initFaceVideo();

  const dances = ['dance1', 'dance2'];
  switchModel(dances[Math.floor(Math.random() * dances.length)]);
  return playerGroup;
}

function initFaceVideo() {
  if (faceVideoEl) return;

  faceVideoEl = document.createElement('video');
  faceVideoEl.src = ASSETS.video;
  faceVideoEl.muted = true;
  faceVideoEl.loop = true;
  faceVideoEl.playsInline = true;
  faceVideoEl.autoplay = true;
  faceVideoEl.crossOrigin = 'anonymous';

  faceVideoTexture = new THREE.VideoTexture(faceVideoEl);
  faceVideoTexture.minFilter = THREE.LinearFilter;
  faceVideoTexture.magFilter = THREE.LinearFilter;
  faceVideoTexture.generateMipmaps = false;
  faceVideoTexture.colorSpace = THREE.SRGBColorSpace;

  // Reduce black background strongly by discarding dark pixels
  const faceMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      map: { value: faceVideoTexture },
      darkCutoff: { value: 0.18 },     // lower = keep more dark tones
      softness: { value: 0.08 }        // edge smoothness
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform float darkCutoff;
      uniform float softness;
      varying vec2 vUv;

      void main() {
        vec4 col = texture2D(map, vUv);
        float luminance = dot(col.rgb, vec3(0.299, 0.587, 0.114));
        float alpha = smoothstep(darkCutoff, darkCutoff + softness, luminance) * col.a;

        if (alpha < 0.03) discard;
        gl_FragColor = vec4(col.rgb, alpha);
      }
    `
  });

  faceVideoMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.faceVideoWidth, CONFIG.faceVideoHeight),
    faceMaterial
  );

  faceVideoMesh.position.set(
    CONFIG.faceVideoOffsetX,
    CONFIG.faceVideoOffsetY,
    CONFIG.faceVideoOffsetZ
  );

  playerGroup.add(faceVideoMesh);

  const tryPlay = () => {
    if (!faceVideoEl) return;
    faceVideoEl.play().catch(() => {});
  };

  tryPlay();
  window.addEventListener('pointerdown', tryPlay, { passive: true, once: false });
  window.addEventListener('touchstart', tryPlay, { passive: true, once: false });
  window.addEventListener('keydown', tryPlay, { passive: true, once: false });
}

function attachFaceVideo() {
  if (!faceVideoMesh || !playerGroup) return;
  if (faceVideoMesh.parent !== playerGroup) {
    playerGroup.add(faceVideoMesh);
  }

  faceVideoMesh.position.set(
    CONFIG.faceVideoOffsetX,
    CONFIG.faceVideoOffsetY,
    CONFIG.faceVideoOffsetZ
  );

  faceVideoMesh.rotation.set(0, Math.PI, 0);
  faceVideoMesh.visible = true;
}

function getModelOffset(modelKey) {
  if (modelKey === 'fall') return CONFIG.fallModelOffsetY;
  if (modelKey === 'jump') return CONFIG.jumpModelOffsetY;
  return CONFIG.normalModelOffsetY;
}

export function switchModel(modelKey) {
  if (!playerGroup) return;
  if (currentModelKey === modelKey) return;

  if (mixer) mixer.stopAllAction();

  while (playerGroup.children.length > 0) {
    const child = playerGroup.children[0];
    playerGroup.remove(child);
  }

  const gltf = loadedAssets.models[modelKey];
  if (!gltf) {
    attachFaceVideo();
    return;
  }

  currentVisualRoot = gltf.scene;
  currentVisualOffsetY = getModelOffset(modelKey);

  currentVisualRoot.scale.set(1, 1, 1);
  currentVisualRoot.position.set(0, 0, 0);

  if (modelKey.includes('dance')) {
    currentVisualRoot.rotation.y = -Math.PI / 2;
  } else {
    currentVisualRoot.rotation.y = Math.PI;
  }

  currentVisualRoot.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(currentVisualRoot);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  if (maxDim > 0) {
    const scaleFactor = CONFIG.modelHeight / maxDim;
    currentVisualRoot.scale.set(scaleFactor, scaleFactor, scaleFactor);
    currentVisualRoot.updateMatrixWorld(true);

    const newBox = new THREE.Box3().setFromObject(currentVisualRoot);
    currentVisualRoot.position.y = -newBox.min.y + currentVisualOffsetY;
  }

  playerGroup.add(currentVisualRoot);
  attachFaceVideo();

  currentModelKey = modelKey;

  if (gltf.animations && gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(currentVisualRoot);
    currentAction = mixer.clipAction(gltf.animations[0]);

    if (modelKey === 'fall' || modelKey === 'jump') {
      currentAction.setLoop(THREE.LoopOnce);
      currentAction.clampWhenFinished = true;
    } else {
      currentAction.setLoop(THREE.LoopRepeat);
    }

    currentAction.play();
  } else {
    mixer = null;
    currentAction = null;
  }
}

function lockVisualRootToGround() {
  if (!currentVisualRoot) return;

  // Critical fix:
  // some jump/fall GLBs have root-motion on Y and make the model fly/sink.
  // We override it every frame so physics controls jump height, not animation.
  currentVisualRoot.position.x = 0;
  currentVisualRoot.position.z = 0;
  currentVisualRoot.position.y = currentVisualOffsetY + Math.max(0, currentVisualRoot.position.y);
}

export function updatePlayer(deltaTime) {
  if (!playerGroup) return;

  if (mixer) mixer.update(deltaTime);
  lockVisualRootToGround();

  if (gameState.current === STATE.INTRO) {
    playerGroup.position.x = CONFIG.roadWidth / 2 - 1.5;
    playerGroup.position.y = CONFIG.playerYOffset;
    attachFaceVideo();
    return;
  }

  if (gameState.current === STATE.DYING) {
    attachFaceVideo();
    return;
  }

  const lerpSpeed = 10;
  playerGroup.position.x += (gameState.targetX - playerGroup.position.x) * lerpSpeed * deltaTime;

  const physicsDelta = Math.min(deltaTime, 1 / 60);

  if (gameState.isJumping) {
    gameState.velocityY += CONFIG.gravity * physicsDelta;
    playerGroup.position.y += gameState.velocityY * physicsDelta;

    if (playerGroup.position.y <= CONFIG.playerYOffset) {
      playerGroup.position.y = CONFIG.playerYOffset;
      gameState.isJumping = false;
      gameState.velocityY = 0;

      spawnCrater(playerGroup.position.x, playerGroup.position.z, 1.0, false);

      if (gameState.current === STATE.PLAYING) {
        switchModel('run');
      }
    }
  } else {
    playerGroup.position.y = CONFIG.playerYOffset;
  }

  attachFaceVideo();
}
