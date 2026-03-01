export function createGame(root, api) {
  let running = false;
  let animationId;

  const assets = {
    models: {
      player: './assets/running.glb',
      jump: './assets/jump.glb',
      fall: './assets/fall.glb',
      dance1: './assets/dance.glb',
      dance2: './assets/dance2.glb'
    },
    textures: {
      fog: './assets/fog.png',
      roads: ['./assets/road1.png', './assets/road2.png', './assets/road3.png'],
      buildings: ['./assets/building4.png', './assets/building5.png']
    },
    video: './assets/mel.webm'
  };

  let scene, camera, renderer;
  let clock;
  let playerGroup, playerModel, mixer;
  let animations = {};
  let currentAction;
  let fogMesh;
  let roadMeshes = [];
  let buildings = [];
  let obstacles = [];
  let coins = [];
  let loadedTextures = {};
  let obstacleGeo, obstacleMat, coinGeo, coinMat;

  const STATE = { LOADING: 0, INTRO: 1, TRANSITION: 2, PLAYING: 3, DYING: 4 };
  let gameState = STATE.LOADING;

  let speed = 0.3;
  let score = 0;
  let coinsCollected = 0;
  let deathTimer = 0;
  let spawnTimer = 0;

  const lanes = [-3, 0, 3];
  let currentLane = 1;
  let targetX = 0;

  let velocityY = 0;
  const gravity = -0.015;
  const jumpPower = 0.3;
  let isJumping = false;

  // Камера: плавное следование
  const CAM_OFFSET = { x: 0, y: 5, z: 10 }; // сзади и выше игрока
  let camX = 0, camY = 5, camZ = 10;

  let uiLayer, loadingText, debugPanel, introText, videoElement, gameUI, overlayGameOver;

  // --- ЛОГГЕР ---
  function logDebug(msg, color = 'white') {
    console.log(msg);
    if (!debugPanel) return;
    const p = document.createElement('div');
    p.style.cssText = `color:${color};font-size:12px;font-family:monospace;margin:1px 0;word-break:break-all;`;
    p.innerText = msg;
    debugPanel.appendChild(p);
    debugPanel.scrollTop = debugPanel.scrollHeight;
  }
  const logOK   = m => logDebug('✅ ' + m, '#00FF41');
  const logWait = m => logDebug('⏳ ' + m, '#ffffaa');
  const logFail = m => logDebug('❌ ' + m, '#FF003C');
  const logInfo = m => logDebug('ℹ️  ' + m, '#88ccff');

  // --- ПРОВЕРКА БИБЛИОТЕК ---
  function checkLibraries() {
    logInfo('--- ПРОВЕРКА БИБЛИОТЕК ---');
    if (typeof THREE === 'undefined') { logFail('THREE не найден!'); return false; }
    logOK('THREE r' + THREE.REVISION);
    if (typeof THREE.GLTFLoader === 'undefined') { logFail('GLTFLoader не найден!'); return false; }
    logOK('GLTFLoader найден');
    if (typeof THREE.DRACOLoader === 'undefined') { logFail('DRACOLoader не найден!'); return false; }
    logOK('DRACOLoader найден');
    return true;
  }

  // --- ЗАГРУЗЧИКИ ---
  function loadGLTF(url) {
    return new Promise((resolve, reject) => {
      logWait('GLB: ' + url);
      const draco = new THREE.DRACOLoader();
      draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
      const loader = new THREE.GLTFLoader();
      loader.setDRACOLoader(draco);
      loader.load(url,
        gltf => { logOK('OK: ' + url); resolve(gltf); },
        undefined,
        err  => { logFail('FAIL: ' + url + ' — ' + (err.message || err)); reject({ url, error: err }); }
      );
    });
  }

  function loadTexture(url) {
    return new Promise((resolve, reject) => {
      logWait('PNG: ' + url);
      new THREE.TextureLoader().load(url,
        tex => { logOK('OK: ' + url); resolve(tex); },
        undefined,
        err => { logFail('FAIL: ' + url); reject({ url, error: err }); }
      );
    });
  }

  // --- ЗАГРУЗКА АССЕТОВ ---
  async function preloadAssets() {
    try {
      if (!checkLibraries()) {
        loadingText.innerHTML = '❌ ОШИБКА БИБЛИОТЕК<br>Смотри лог ниже';
        return;
      }

      logInfo('--- ЗАГРУЗКА ТЕКСТУР ---');
      loadedTextures.fog = await loadTexture(assets.textures.fog);

      loadedTextures.roads = [];
      for (const url of assets.textures.roads)
        loadedTextures.roads.push(await loadTexture(url));

      loadedTextures.buildings = [];
      for (const url of assets.textures.buildings)
        loadedTextures.buildings.push(await loadTexture(url));

      loadedTextures.roads.forEach(t => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(1, 20); // больше тайлов — меньше видно стык
      });
      loadedTextures.buildings.forEach(t => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(2, 5);
      });

      logInfo('--- ЗАГРУЗКА МОДЕЛЕЙ ---');
      const playerGltf = await loadGLTF(assets.models.player);
      playerModel = playerGltf.scene;
      playerModel.scale.set(1, 1, 1);
      mixer = new THREE.AnimationMixer(playerModel);
      logInfo('Анимаций в running.glb: ' + playerGltf.animations.length);
      if (playerGltf.animations[0]) animations['run'] = playerGltf.animations[0];

      const jumpGltf  = await loadGLTF(assets.models.jump);
      if (jumpGltf.animations[0])  animations['jump']  = jumpGltf.animations[0];

      const fallGltf  = await loadGLTF(assets.models.fall);
      if (fallGltf.animations[0])  animations['fall']  = fallGltf.animations[0];

      const d1Gltf    = await loadGLTF(assets.models.dance1);
      if (d1Gltf.animations[0])    animations['dance1'] = d1Gltf.animations[0];

      const d2Gltf    = await loadGLTF(assets.models.dance2);
      if (d2Gltf.animations[0])    animations['dance2'] = d2Gltf.animations[0];

      logOK('=== ВСЕ ЗАГРУЖЕНО ===');

      setTimeout(() => {
        debugPanel.style.display = 'none';
        setupWorld();
        startIntro();
      }, 800);

    } catch (e) {
      logFail('КРИТИЧЕСКАЯ ОШИБКА: ' + (e.url || '') + ' ' + (e.error?.message || String(e)));
      loadingText.innerHTML = '❌ КРАШ ЗАГРУЗКИ<br>Смотри лог ниже 👇';
    }
  }

  // --- АНИМАЦИИ ---
  function playAnim(name, fadeTime = 0.2) {
    if (!mixer || !animations[name]) return;
    const next = mixer.clipAction(animations[name]);
    if (currentAction && currentAction !== next) {
      currentAction.crossFadeTo(next, fadeTime, true);
    }
    next.reset().play();
    currentAction = next;
  }

  // --- ИНИЦИАЛИЗАЦИЯ 3D ---
  function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    scene.fog = new THREE.FogExp2(0x111111, 0.018);

    const w = root.clientWidth  || window.innerWidth;
    const h = root.clientHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(65, w / h, 0.1, 500);
    camera.position.set(0, 5, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // Свет
    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 15, 5);
    dir.castShadow = true;
    dir.shadow.camera.near = 0.1;
    dir.shadow.camera.far = 100;
    dir.shadow.mapSize.set(1024, 1024);
    scene.add(dir);

    // Подсветка сзади (для объёма)
    const back = new THREE.DirectionalLight(0x4466ff, 0.3);
    back.position.set(-5, 5, -10);
    scene.add(back);

    setupControls();
    window.addEventListener('resize', onWindowResize);
  }

  // --- МИР ---
  // Дорога: 6 сегментов которые циклятся — никакого мигания!
  const ROAD_SEG_LEN = 60;
  const ROAD_COUNT   = 6; // достаточно чтобы всегда покрывать экран

  function setupWorld() {
    // Игрок
    playerGroup = new THREE.Group();
    playerGroup.add(playerModel);
    scene.add(playerGroup);

    // Инициализируем позицию камеры рядом с игроком
    camX = playerGroup.position.x;
    camY = playerGroup.position.y + CAM_OFFSET.y;
    camZ = playerGroup.position.z + CAM_OFFSET.z;

    // Дорога — много сегментов, равномерно расставлены
    for (let i = 0; i < ROAD_COUNT; i++) {
      const tex = loadedTextures.roads[i % loadedTextures.roads.length].clone();
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, ROAD_SEG_LEN / 6);
      tex.needsUpdate = true;

      const geo = new THREE.PlaneGeometry(12, ROAD_SEG_LEN);
      const mat = new THREE.MeshStandardMaterial({ map: tex });
      const road = new THREE.Mesh(geo, mat);
      road.rotation.x = -Math.PI / 2;
      road.receiveShadow = true;
      // Расставляем назад от игрока (игрок движется в -Z)
      road.position.set(0, 0, -(i * ROAD_SEG_LEN) + ROAD_SEG_LEN);
      scene.add(road);
      roadMeshes.push(road);
    }

    // Туманный спрайт (смерть)
    fogMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 20),
      new THREE.MeshBasicMaterial({
        map: loadedTextures.fog,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    fogMesh.visible = false;
    scene.add(fogMesh);

    // Здания
    const bGeo = new THREE.BoxGeometry(8, 35, 12);
    for (let i = 0; i < 30; i++) {
      const tex = loadedTextures.buildings[Math.floor(Math.random() * loadedTextures.buildings.length)];
      const b = new THREE.Mesh(bGeo, new THREE.MeshStandardMaterial({ map: tex }));
      b.position.set(
        Math.random() > 0.5 ? 14 : -14,
        17,
        -(Math.random() * 400)
      );
      scene.add(b);
      buildings.push(b);
    }

    // Геометрия препятствий и монет
    obstacleGeo = new THREE.BoxGeometry(2, 2, 2);
    obstacleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.3 });
    coinGeo = new THREE.OctahedronGeometry(0.5);
    coinMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xaa6600, roughness: 0.2 });
  }

  // --- ИНТРО: ТАНЕЦ с камерой вокруг ---
  function startIntro() {
    gameState = STATE.INTRO;
    loadingText.style.display = 'none';
    introText.style.display = 'block';

    // Игрок стоит на месте, смотрит на нас
    playerGroup.position.set(0, 0, 0);
    playerGroup.rotation.y = 0; // смотрит на камеру

    // Камера — спереди-сбоку, видно всего игрока
    camera.position.set(3, 2.5, 5);
    camera.lookAt(0, 1.2, 0);

    const dance = Math.random() > 0.5 ? 'dance1' : 'dance2';
    playAnim(dance, 0.3);

    root.addEventListener('click', onIntroClick, { once: true });
  }

  // --- ПЕРЕХОД: видео на весь экран ---
  function onIntroClick() {
    if (gameState !== STATE.INTRO) return;
    gameState = STATE.TRANSITION;
    introText.style.display = 'none';

    videoElement.style.display = 'block';
    videoElement.play().catch(() => {});

    setTimeout(startRun, 2500);
  }

  // --- СТАРТ БЕГА ---
  function startRun() {
    gameState = STATE.PLAYING;
    videoElement.style.display = 'none';
    videoElement.pause();
    gameUI.style.display = 'flex';

    // Игрок смотрит вперёд (в -Z)
    playerGroup.rotation.y = Math.PI;
    playerGroup.position.set(0, 0, 0);

    // Сбрасываем позицию дороги относительно игрока
    repositionRoads();

    // Камера — сразу за спиной
    camX = 0;
    camY = CAM_OFFSET.y;
    camZ = CAM_OFFSET.z;
    camera.position.set(camX, camY, camZ);
    camera.lookAt(0, 1, -10);

    playAnim('run', 0.3);
  }

  function repositionRoads() {
    const pz = playerGroup.position.z;
    for (let i = 0; i < ROAD_COUNT; i++) {
      roadMeshes[i].position.z = pz + ROAD_SEG_LEN - i * ROAD_SEG_LEN;
    }
  }

  // --- УПРАВЛЕНИЕ ---
  function moveLeft()  { if (currentLane > 0 && gameState === STATE.PLAYING) { currentLane--; targetX = lanes[currentLane]; } }
  function moveRight() { if (currentLane < 2 && gameState === STATE.PLAYING) { currentLane++; targetX = lanes[currentLane]; } }
  function doJump() {
    if (!isJumping && gameState === STATE.PLAYING) {
      isJumping = true;
      velocityY = jumpPower;
      playAnim('jump', 0.1);
    }
  }

  function handleKeyDown(e) {
    if (!running) return;
    if (['ArrowLeft', 'KeyA'].includes(e.code))             { e.preventDefault(); moveLeft(); }
    if (['ArrowRight', 'KeyD'].includes(e.code))            { e.preventDefault(); moveRight(); }
    if (['ArrowUp', 'KeyW', 'Space'].includes(e.code))      { e.preventDefault(); doJump(); }
  }

  let touchX = 0, touchY = 0;
  const handleTouchStart = e => { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; };
  const handleTouchEnd   = e => {
    if (!running || gameState !== STATE.PLAYING) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > Math.abs(dy)) { if (Math.abs(dx) > 25) dx > 0 ? moveRight() : moveLeft(); }
    else { if (dy < -25) doJump(); }
  };

  function setupControls() {
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    root.addEventListener('touchstart', handleTouchStart, { passive: true });
    root.addEventListener('touchend',   handleTouchEnd);
  }

  // --- СПАВН ---
  function spawnRow() {
    const pz = playerGroup.position.z;
    const spawnZ = pz - 90;

    const obsLane = Math.floor(Math.random() * 3);
    const obs = new THREE.Mesh(obstacleGeo, obstacleMat);
    obs.position.set(lanes[obsLane], 1, spawnZ);
    obs.castShadow = true;
    scene.add(obs);
    obstacles.push(obs);

    // Монета в другой полосе
    const available = [0, 1, 2].filter(l => l !== obsLane);
    if (Math.random() > 0.3) {
      const coinLane = available[Math.floor(Math.random() * available.length)];
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.position.set(lanes[coinLane], 1.2, spawnZ + (Math.random() * 10 - 5));
      scene.add(coin);
      coins.push(coin);
    }
  }

  // --- ГЛАВНЫЙ ЦИКЛ ---
  function animate() {
    if (!running) return;
    animationId = requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05); // ограничиваем чтобы не прыгало
    if (mixer) mixer.update(delta);

    if (gameState === STATE.INTRO) {
      // Красивое вращение камеры вокруг персонажа
      const t = Date.now() * 0.0008;
      camera.position.set(
        Math.sin(t) * 4.5,
        2.2 + Math.sin(t * 0.5) * 0.3,
        Math.cos(t) * 4.5
      );
      camera.lookAt(0, 1.2, 0);
    }

    else if (gameState === STATE.PLAYING) {
      // Движение
      speed += 0.00005;
      playerGroup.position.z -= speed;

      // Смена полосы — плавно
      playerGroup.position.x += (targetX - playerGroup.position.x) * 0.12;

      // Прыжок
      if (isJumping) {
        playerGroup.position.y += velocityY;
        velocityY += gravity;
        if (playerGroup.position.y <= 0) {
          playerGroup.position.y = 0;
          isJumping = false;
          velocityY = 0;
          playAnim('run', 0.15);
        }
      }

      // ============================
      // КАМЕРА ТРЕТЬЕГО ЛИЦА
      // Плавно следует за игроком сзади-сверху, как в Temple Run
      // ============================
      const targetCamX = playerGroup.position.x * 0.4;
      const targetCamY = playerGroup.position.y + CAM_OFFSET.y;
      const targetCamZ = playerGroup.position.z + CAM_OFFSET.z;

      const lerpSpeed = 0.1;
      camX += (targetCamX - camX) * lerpSpeed;
      camY += (targetCamY - camY) * lerpSpeed;
      camZ += (targetCamZ - camZ) * lerpSpeed;

      camera.position.set(camX, camY, camZ);
      // Смотрим чуть вперёд игрока
      camera.lookAt(
        playerGroup.position.x,
        playerGroup.position.y + 1,
        playerGroup.position.z - 15
      );

      // ============================
      // БЕСШОВНАЯ ДОРОГА
      // Сегмент который остался позади — перекидываем вперёд
      // ============================
      const pz = playerGroup.position.z;
      for (const road of roadMeshes) {
        // Если сегмент уже позади камеры — перекидываем вперёд
        if (road.position.z > pz + ROAD_SEG_LEN * 1.5) {
          road.position.z -= ROAD_COUNT * ROAD_SEG_LEN;
        }
      }

      // Здания
      for (const b of buildings) {
        if (b.position.z > pz + 30) b.position.z -= 420;
      }

      // Спавн
      spawnTimer++;
      const spawnInterval = Math.max(15, Math.floor(50 - speed * 50));
      if (spawnTimer >= spawnInterval) { spawnRow(); spawnTimer = 0; }

      // Монеты
      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.rotation.y += 0.06;
        // Сбор
        if (
          Math.abs(c.position.z - pz) < 1.5 &&
          Math.abs(c.position.x - playerGroup.position.x) < 1.5 &&
          playerGroup.position.y < 3
        ) {
          scene.remove(c); coins.splice(i, 1);
          coinsCollected++;
          document.getElementById('cUi').innerText = 'CASH: ' + coinsCollected;
          continue;
        }
        // Убираем старые
        if (c.position.z > pz + 20) { scene.remove(c); coins.splice(i, 1); }
      }

      // Препятствия
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (
          Math.abs(obs.position.z - pz) < 1.3 &&
          Math.abs(obs.position.x - playerGroup.position.x) < 1.3 &&
          playerGroup.position.y < 2.2
        ) {
          triggerDeath();
          break;
        }
        if (obs.position.z > pz + 20) { scene.remove(obs); obstacles.splice(i, 1); }
      }

      score = Math.floor(Math.abs(pz));
      document.getElementById('sUi').innerText = 'SCORE: ' + score;
    }

    else if (gameState === STATE.DYING) {
      deathTimer++;

      // Туман летит на игрока
      if (!fogMesh.visible) {
        fogMesh.visible = true;
        // Ставим туман далеко позади камеры (он "догоняет")
        fogMesh.position.set(
          camera.position.x,
          camera.position.y,
          playerGroup.position.z + 40
        );
      }

      // Туман приближается
      const fogSpeed = deathTimer < 60 ? speed * 0.6 : speed * 5;
      fogMesh.position.z -= fogSpeed;

      // Туман смотрит на камеру (billboard эффект)
      fogMesh.lookAt(camera.position);

      // Камера медленно опускается и смотрит на игрока (упал)
      camera.position.y += (1.5 - camera.position.y) * 0.03;
      camera.lookAt(
        playerGroup.position.x,
        playerGroup.position.y + 0.5,
        playerGroup.position.z
      );

      // Туман поглотил — конец
      if (fogMesh.position.z > camera.position.z - 2) {
        fogMesh.visible = false;
        running = false;
        overlayGameOver.style.display = 'flex';
        document.getElementById('goScore').innerText = score;
        document.getElementById('goCoins').innerText = '+' + coinsCollected;
      }
    }

    renderer.render(scene, camera);
  }

  // --- СМЕРТЬ ---
  function triggerDeath() {
    if (gameState === STATE.DYING) return;
    gameState = STATE.DYING;
    deathTimer = 0;
    playAnim('fall', 0.1);
    api.addCoins(coinsCollected);
    api.setHighScore(score);
    api.onUiUpdate();
  }

  // --- РЕСТАРТ ---
  function resetGame() {
    speed = 0.3; score = 0; coinsCollected = 0;
    currentLane = 1; targetX = lanes[currentLane];
    isJumping = false; velocityY = 0; deathTimer = 0;
    spawnTimer = 0;

    playerGroup.position.set(0, 0, 0);
    playerGroup.rotation.y = Math.PI;

    obstacles.forEach(o => scene.remove(o)); obstacles = [];
    coins.forEach(c => scene.remove(c));     coins = [];

    fogMesh.visible = false;

    repositionRoads();
    buildings.forEach(b => { b.position.z = -(Math.random() * 400); });

    camX = 0; camY = CAM_OFFSET.y; camZ = CAM_OFFSET.z;

    overlayGameOver.style.display = 'none';
    document.getElementById('sUi').innerText = 'SCORE: 0';
    document.getElementById('cUi').innerText = 'CASH: 0';

    startRun();
    running = true;
    animate();
  }

  // --- РЕСАЙЗ ---
  function onWindowResize() {
    if (!camera || !renderer) return;
    const w = root.clientWidth  || window.innerWidth;
    const h = root.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  // --- UI ---
  function buildUI() {
    uiLayer = document.createElement('div');
    Object.assign(uiLayer.style, {
      position: 'absolute', inset: '0',
      pointerEvents: 'none', zIndex: '10',
      fontFamily: 'Impact'
    });
    root.appendChild(uiLayer);

    loadingText = document.createElement('div');
    loadingText.innerText = 'ЗАГРУЗКА ХАЙПА...';
    loadingText.style.cssText = 'position:absolute;top:8%;left:50%;transform:translateX(-50%);color:#FF003C;font-size:22px;text-shadow:2px 2px 0 #000;text-align:center;font-family:monospace;line-height:1.6;white-space:nowrap;';
    uiLayer.appendChild(loadingText);

    debugPanel = document.createElement('div');
    debugPanel.style.cssText = 'position:absolute;top:16%;left:2%;right:2%;bottom:2%;background:rgba(0,0,0,0.93);border:2px solid #444;overflow-y:auto;padding:10px;z-index:999;pointer-events:auto;font-family:monospace;';
    uiLayer.appendChild(debugPanel);

    introText = document.createElement('div');
    introText.innerText = 'ТАПАЙ ЧТОБЫ НАЧАТЬ!';
    introText.style.cssText = 'position:absolute;bottom:18%;left:50%;transform:translateX(-50%);color:#00FF41;font-size:36px;text-shadow:3px 3px 0 #000;display:none;cursor:pointer;pointer-events:auto;animation:pulse 0.9s infinite alternate;';
    uiLayer.appendChild(introText);

    const style = document.createElement('style');
    style.innerHTML = '@keyframes pulse{from{transform:translateX(-50%) scale(1)}to{transform:translateX(-50%) scale(1.08)}}';
    document.head.appendChild(style);

    videoElement = document.createElement('video');
    videoElement.src = assets.video;
    videoElement.playsInline = true;
    videoElement.muted = false;
    videoElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none;z-index:20;pointer-events:none;';
    root.appendChild(videoElement);

    gameUI = document.createElement('div');
    gameUI.style.cssText = 'position:absolute;top:12px;width:100%;display:none;justify-content:center;gap:30px;z-index:12;';
    gameUI.innerHTML = `
      <div id="sUi" style="color:#fff;font-size:22px;text-shadow:2px 2px 0 #000;">SCORE: 0</div>
      <div id="cUi" style="color:#FFD700;font-size:22px;text-shadow:2px 2px 0 #000;">CASH: 0</div>
    `;
    uiLayer.appendChild(gameUI);

    overlayGameOver = document.createElement('div');
    overlayGameOver.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.92);z-index:25;display:none;flex-direction:column;align-items:center;justify-content:center;color:#fff;pointer-events:auto;font-family:Impact;';
    overlayGameOver.innerHTML = `
      <h1 style="font-size:48px;margin:0;color:#FF003C;text-shadow:3px 3px 0 #000;">ФОГ СЪЕЛ!</h1>
      <h2 style="margin:15px 0 5px;font-size:28px;">SCORE: <span id="goScore" style="color:#FFD700;">0</span></h2>
      <h2 style="margin:0;font-size:28px;color:#00FF41;">КЭШ: <span id="goCoins">0</span></h2>
      <button id="btnRestart" style="margin-top:35px;padding:16px 50px;font-size:26px;font-family:Impact;background:linear-gradient(90deg,#FFD700,#ff8800);border:none;border-radius:8px;cursor:pointer;color:#000;font-weight:900;box-shadow:0 0 20px rgba(255,215,0,0.5);">ЕЩЕ РАЗ</button>
    `;
    uiLayer.appendChild(overlayGameOver);
    overlayGameOver.querySelector('#btnRestart').addEventListener('click', resetGame);
  }

  // --- СТАРТ ---
  function start() {
    if (running) return;
    running = true;
    root.innerHTML = '';

    buildUI();
    init3D();
    preloadAssets();
    animate();
  }

  return {
    start,
    stop() {
      running = false;
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      root.removeEventListener('touchstart', handleTouchStart);
      root.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', onWindowResize);
      root.innerHTML = '';
    }
  };
}
