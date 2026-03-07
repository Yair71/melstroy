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
  scene.background = new THREE.Color(0x050505);
  scene.fog = new THREE.FogExp2(0x050505, 0.05);

  const camera = new THREE.PerspectiveCamera(
    60,
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

  const hemi = new THREE.HemisphereLight(0x7a8596, 0x030303, 1.15);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xe9eef8, 1.35);
  dir.position.set(5, 16, 7);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.left = -22;
  dir.shadow.camera.right = 22;
  dir.shadow.camera.top = 22;
  dir.shadow.camera.bottom = -22;
  dir.shadow.camera.near = 1;
  dir.shadow.camera.far = 80;
  scene.add(dir);

  const fill = new THREE.PointLight(0x95b6ff, 0.8, 16, 2);
  fill.position.set(0, 3.5, -3);
  scene.add(fill);

  let assets = null;
  let player = null;
  let world = null;
  let input = null;

  const deathState = {
    elapsed: 0
  };

  function updateIntroCamera(dt) {
    const targetPos = new THREE.Vector3(0, 2.15, 4.9);
    camera.position.lerp(targetPos, 1 - Math.pow(0.001, dt));
    camera.lookAt(new THREE.Vector3(0, 1.2, 0));
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

    camera.position.lerp(camPos, 1 - Math.pow(0.0001, dt));
    camera.lookAt(lookAt);

    const laneDelta = player.laneTarget() - player.laneIndex();
    camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, -laneDelta * 0.03, 0.08);
  }

  function updateDeathCamera(dt) {
    deathState.elapsed += dt;
    const t = Math.min(deathState.elapsed / config.camera.deathDuration, 1);

    const eyePos = player.group.position.clone().add(new THREE.Vector3(0, 1.55, 0.12));
    camera.position.lerp(eyePos, 1 - Math.pow(0.0001, dt));

    const lookTarget = player.group.position.clone().add(
      new THREE.Vector3(
        Math.sin(t * Math.PI) * 0.6,
        1.45,
        5.0 - t * 3.1
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

    ui.subtitle.textContent = 'MELSTROY IS RUNNING...';
    await player.showFaceVideoBriefly(700);

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
      ui.showError(err?.message || 'Check assets and loader scripts.');
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

      const playerWorldBounds = player.getBounds().clone();
      playerWorldBounds.min.z += distance;
      playerWorldBounds.max.z += distance;

      const hit = world.getObstacleHit(
        playerWorldBounds,
        player.group.position.x,
        player.isJumping(),
        distance
      );

      if (hit) {
        startDeath();
      }

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
