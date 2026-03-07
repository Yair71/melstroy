import { createAnimationSet, findBoneByGuess } from './animationBinder.js';

const THREE = window.THREE;

function findFirstRenderable(root) {
  let found = null;
  root.traverse(obj => {
    if (found) return;
    if (obj.isSkinnedMesh || obj.isMesh) found = obj;
  });
  return found || root;
}

export function createPlayer(scene, assets, config) {
  const modelScene = assets.modelGltf.scene.clone(true);
  const group = new THREE.Group();

  modelScene.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  group.add(modelScene);
  group.scale.setScalar(config.player.scale);
  group.position.set(config.lanes[config.player.startLane], config.player.y, 0);
  group.rotation.y = Math.PI;

  scene.add(group);

  const animation = createAnimationSet(modelScene, assets.clipSources);
  const visibleRoot = findFirstRenderable(modelScene);

  const bounds = new THREE.Box3();

  let laneIndex = config.player.startLane;
  let laneTarget = config.player.startLane;
  let jumpVelocity = 0;
  let isJumping = false;

  const headBone =
    findBoneByGuess(modelScene, ['head', 'neck', 'face']) ||
    modelScene;

  const faceVideo = document.createElement('video');
  faceVideo.src = assets.videoUrl;
  faceVideo.loop = false;
  faceVideo.muted = true;
  faceVideo.playsInline = true;
  faceVideo.preload = 'auto';

  const videoTexture = new THREE.VideoTexture(faceVideo);
  if ('colorSpace' in videoTexture && THREE.SRGBColorSpace) {
    videoTexture.colorSpace = THREE.SRGBColorSpace;
  } else if ('encoding' in videoTexture && THREE.sRGBEncoding) {
    videoTexture.encoding = THREE.sRGBEncoding;
  }

  const facePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.62),
    new THREE.MeshBasicMaterial({
      map: videoTexture,
      transparent: true,
      opacity: 0.98,
      side: THREE.DoubleSide
    })
  );
  facePlane.position.set(0, 0.05, 0.22);
  facePlane.visible = false;
  headBone.add(facePlane);

  function playIntroDance() {
    animation.play(Math.random() < 0.5 ? 'dance1' : 'dance2', { fade: 0.05, once: false });
  }

  function playRun() {
    animation.play('run', { fade: 0.10, once: false });
  }

  function playJump() {
    animation.play('jump', { fade: 0.08, once: true });
  }

  function playFall() {
    animation.play('fall', { fade: 0.06, once: true });
  }

  function moveLeft() {
    laneTarget = Math.max(0, laneTarget - 1);
  }

  function moveRight() {
    laneTarget = Math.min(config.lanes.length - 1, laneTarget + 1);
  }

  function jump() {
    if (isJumping) return false;
    isJumping = true;
    jumpVelocity = config.player.jumpVelocity;
    playJump();
    return true;
  }

  function update(dt, isRunning) {
    animation.update(dt);

    const targetX = config.lanes[laneTarget];
    group.position.x = THREE.MathUtils.lerp(
      group.position.x,
      targetX,
      1 - Math.pow(0.0001, dt * config.player.laneLerp)
    );

    if (Math.abs(group.position.x - targetX) < 0.05) {
      laneIndex = laneTarget;
    }

    if (isJumping) {
      group.position.y += jumpVelocity * dt;
      jumpVelocity -= config.player.gravity * dt;

      if (group.position.y <= config.player.y) {
        group.position.y = config.player.y;
        jumpVelocity = 0;
        isJumping = false;
        if (isRunning) playRun();
      }
    }

    const laneTilt = (targetX - group.position.x) * -0.08;
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, laneTilt, 0.12);
  }

  function getBounds() {
    bounds.setFromObject(group);

    bounds.min.x += config.player.collisionShrinkX;
    bounds.max.x -= config.player.collisionShrinkX;
    bounds.min.y += config.player.collisionShrinkY;
    bounds.max.y -= config.player.collisionShrinkY;
    bounds.min.z += config.player.collisionShrinkZ;
    bounds.max.z -= config.player.collisionShrinkZ;

    return bounds;
  }

  async function showFaceVideoBriefly(ms = 900) {
    facePlane.visible = true;

    try {
      await faceVideo.play();
    } catch (_) {
      // ignore autoplay issues
    }

    return new Promise(resolve => {
      setTimeout(() => {
        facePlane.visible = false;
        faceVideo.pause();
        try {
          faceVideo.currentTime = 0;
        } catch (_) {}
        resolve();
      }, ms);
    });
  }

  function dispose() {
    faceVideo.pause();
    faceVideo.src = '';
    faceVideo.load();
  }

  return {
    group,
    visibleRoot,
    laneIndex: () => laneIndex,
    laneTarget: () => laneTarget,
    isJumping: () => isJumping,
    moveLeft,
    moveRight,
    jump,
    update,
    getBounds,
    playIntroDance,
    playRun,
    playFall,
    showFaceVideoBriefly,
    dispose
  };
}
