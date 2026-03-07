import { MURINO_CONFIG } from './config.js';
import { loadMurinoAssets } from './assets.js';
import { createMurinoUI } from './ui.js';
import { attachMurinoInput } from './input.js';
import { createPlayer } from './player.js';
import { createWorld } from './world.js';

const THREE = window.THREE;

export function createGame(root, api = {}) {
  const config = MURINO_CONFIG;

  let destroyed = false;
  let rafId = 0;
  let distance = 0;
  let score = 0;
  let speed = config.gameplay.startSpeed;

  const phase = {
    value: 'loading' // loading | intro | transition | running | dying | dead
  };

  root.innerHTML = '';
  root.style.position = 'relative';
  root.style.overflow = 'hidden';
  root.style.background = '#000';

  const ui = createMurinoUI(root);
  ui.showLoading();

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(root.clientWidth || window.innerWidth, root.clientHeight || window.innerHeight);

  if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else if ('outputEncoding' in renderer && THREE.sRGBEncoding) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  ui.canvasHost.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070707);
  scene.fog = new THREE.FogExp2(0x080808, 0.03);

  const camera = new THREE.PerspectiveCamera(
    55,
    (root.clientWidth || window.innerWidth) / (root.clientHeight || window.innerHeight),
    0.1,
    500
  );

  camera.position.set(
    config.camera.introPos.x,
    config.camera.introPos.y,
    config.camera.introPos.z
  );

  const clock = new THREE.Clock();

  const hemi = new THREE.HemisphereLight(0x6f7b8b, 0x050505, 1.25);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xe8eef7, 1.55);
  dir.position.set(8, 22, 10);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.left = -40;
  dir.shadow.camera.right = 40;
  dir.shadow.camera.top = 40;
  dir.shadow.camera.bottom = -40;
  dir.shadow.camera.near = 1;
  dir.shadow.camera.far = 100;
  scene.add(dir);

  const fill = new THREE.PointLight(0x88aaff, 1.1, 26, 2);
  fill.position.set(0, 4, -5);
  scene.add(fill);

  let assets = null;
  let player = null;
  let world = null;
  let input = null;

  const deathState = {
    elapsed: 0
  };

  function updateIntroCamera(dt) {
    const targetPos = new THREE.Vector3(0, 2.6, 7.7);
    camera.position.lerp(targetPos, 1 - Math.pow(0.001, dt));
    camera.lookAt(new THREE.Vector3(0, 1.8, 0));
  }

  function updateGameplayCamera(dt) {
    const playerPos = player.group.position;

    const camPos = new THREE.Vector3(
      playerPos.x + config.camera.gameplayOffset.x,
      playerPos.y + config.camera.gameplayOffset.y,
      playerPos.z + config.camera.gameplayOffset.z
    );

    const lookAt = new THREE.Vector3(
      playerPos.x + config.camera.gameplayLookAhead.x,
      playerPos.y + config.camera.gameplayLookAhead.y,
      playerPos.z + config.camera.gameplayLookAhead.z
    );

    camera.position.lerp(camPos, 1 - Math.pow(0.001, dt));
    camera.lookAt(lookAt);
  }

  function updateDeathCamera(dt) {
    deathState.elapsed += dt;
    const t = Math.min(deathState.elapsed / config.camera.deathDuration, 1);

    const eyePos = player.group.position.clone().add(new THREE.Vector3(0, 1.8, 0.18));
    camera.position.lerp(eyePos, 1 - Math.pow(0.0001, dt));

    const lookTarget = player.group.position.clone().add(
      new THREE.Vector3(
        Math.sin(t * Math.PI) * 0.9,
        1.7,
        6.0 - t * 3.8
      )
    );

    camera.lookAt(lookTarget);
    world.updateDeathFog(dt, player.group.position, clock.elapsedTime, config);

    if (t >= 1 && phase.value !== 'dead') {
      phase.value = 'dead';
      ui.showGameOver(distance, score);
    }
  }

  async function startRun() {
    if (phase.value !== 'intro') return;
    phase.value = 'transition';

    ui.subtitle.textContent = 'Face video... then run.';
    await player.showFaceVideoBriefly(900);

    player.playRun();
    phase.value = 'running';
    ui.showRunning();
  }

  function startDeath() {
    if (phase.value === 'dying' || phase.value === 'dead') return;
    phase.value = 'dying';
    deathState.elapsed = 0;
    player.playFall();
    world.beginDeathFog(player.group.position, config);
  }

  function handleLeft() {
    if (phase.value === 'running') player.moveLeft();
  }

  function handleRight() {
    if (phase.value === 'running') player.moveRight();
  }

  function handleJump() {
    if (phase.value === 'intro') {
      startRun();
      return;
    }
    if (phase.value === 'running') {
      player.jump();
    }
  }

  function handleEnter() {
    if (phase.value === 'intro') {
      startRun();
    } else if (phase.value === 'dead') {
      restart();
    }
  }

  function onResize() {
    if (destroyed) return;
    const w = root.clientWidth || window.innerWidth;
    const h = root.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  async function init() {
    try {
      assets = await loadMurinoAssets(renderer, config);
      player = createPlayer(scene, assets, config);
      world = createWorld(scene, assets, config);
      player.playIntroDance();

      input = attachMurinoInput(renderer.domElement, {
        left: handleLeft,
        right: handleRight,
        jump: handleJump,
        enter: handleEnter
      });

      ui.showIntro(config.ui.title, config.ui.subtitle);

      ui.startBtn.onclick = startRun;
      ui.restartBtn.onclick = restart;

      window.addEventListener('resize', onResize);

      phase.value = 'intro';
      animate();
    } catch (err) {
      console.error('[MurinoRun] init error:', err);
      ui.showError(err?.message || 'Check assets and CDN loaders.');
      ui.restartBtn.onclick = restart;
    }
  }

  function animate() {
    if (destroyed) return;

    rafId = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.033);

    if (phase.value === 'intro' || phase.value === 'transition') {
      player?.update(dt, false);
      updateIntroCamera(dt);
    }

    if (phase.value === 'running') {
      speed = Math.min(config.gameplay.maxSpeed, speed + config.gameplay.accelPerSecond * dt);
      distance += speed * dt;
      score += speed * dt * config.gameplay.scoreFactor;

      player.update(dt, true);
      world.update(distance, dt);
      updateGameplayCamera(dt);

      const playerBounds = player.getBounds().clone();
      playerBounds.min.z += distance;
      playerBounds.max.z += distance;

      const shiftedPlayerBounds = player.getBounds().clone();
      shiftedPlayerBounds.min.z += distance;
      shiftedPlayerBounds.max.z += distance;

      const playerWorldBounds = player.getBounds().clone();
      playerWorldBounds.min.z += distance;
      playerWorldBounds.max.z += distance;

      const hit = world.getObstacleHit(
        playerWorldBounds,
        player.group.position.x,
        player.isJumping()
      );

      if (hit) startDeath();

      ui.setScore(score);
    }

    if (phase.value === 'dying') {
      player.update(dt, false);
      updateDeathCamera(dt);
    }

    renderer.render(scene, camera);
  }

  function cleanup() {
    destroyed = true;
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);

    input?.dispose?.();
    player?.dispose?.();
    world?.dispose?.();

    scene.traverse(obj => {
      if (obj.geometry?.dispose) obj.geometry.dispose();

      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => {
            if (m.map?.dispose) m.map.dispose();
            if (m.dispose) m.dispose();
          });
        } else {
          if (obj.material.map?.dispose) obj.material.map.dispose();
          if (obj.material.dispose) obj.material.dispose();
        }
      }
    });

    renderer.dispose();
    root.innerHTML = '';
  }

  function restart() {
    cleanup();
    createGame(root, api);
  }

  init();

  return {
    stop: cleanup,
    destroy: cleanup
  };
}
