export function createGame(root, api) {
  let running = false;
  let animationId;

  // --- CONFIGURATION ---
  const assets = {
    models: {
      player: './assets/mel.glb',
      run: './assets/running.glb',
      jump: './assets/jump.glb',
      fall: './assets/fall.glb',
      dance1: './assets/dance.glb',
      dance2: './assets/dance2.glb'
    },
    textures: {
      fog: './assets/fog.png',
      roads: [
        './assets/road1.png',
        './assets/road2.png',
        './assets/road3.png'
      ],
      buildings: [
        './assets/building4.png',
        './assets/building5.png'
      ]
    },
    video: './assets/mel.webm'
  };

  // --- THREE.JS CORE ---
  let scene, camera, renderer, dummyCamera;
  let clock;

  // --- PLAYER & ANIMATIONS ---
  let playerGroup, playerModel, mixer;
  let animations = {};
  let currentAction;

  // --- ENVIRONMENT ---
  let fogMesh;
  // Road is now a POOL of segments that we recycle
  const ROAD_SEG_LENGTH = 30;
  const ROAD_SEG_COUNT  = 10; // enough to fill the view
  let roadPool = [];   // { mesh, zOffset }

  let buildings = [];
  let obstacles = [];
  let coins = [];

  let loadedTextures = {};
  let obstacleGeo, obstacleMat;
  let coinGeo, coinMat;

  // Horror atmosphere objects
  let scareCrows = [];
  let groundFog;
  let bloodParticles = [];
  let skyDome;
  let cracks = [];

  // --- GAME STATES ---
  const STATE = { LOADING: 0, INTRO: 1, TRANSITION: 2, PLAYING: 3, DYING: 4 };
  let gameState = STATE.LOADING;

  // --- LOGIC VARIABLES ---
  let speed = 0.3;
  let score = 0;
  let coinsCollected = 0;
  let deathTimer = 0;
  let spawnTimer = 0;

  const lanes = [-3, 0, 3];
  let currentLane = 1;
  let targetX = 0;

  const PLAYER_Y_OFFSET = 0;
  let velocityY = 0;
  const gravity = -0.015;
  const jumpPower = 0.28;
  let isJumping = false;

  // Track the furthest Z we've ever placed road/obstacles so we can extend forward
  let worldZ = 0; // absolute Z of player start; road goes in -Z direction

  let uiLayer, loadingText, debugPanel, introText, videoElement, gameUI, overlayGameOver;

  // ============================================================
  // DEBUG
  // ============================================================
  function logDebug(msg, color = 'white') {
    console.log(msg);
    if (debugPanel) {
      const p = document.createElement('div');
      p.style.cssText = `color:${color};font-size:12px;font-family:monospace;margin:2px 0;word-break:break-all;text-shadow:1px 1px 0 #000;`;
      p.innerText = msg;
      debugPanel.appendChild(p);
      debugPanel.scrollTop = debugPanel.scrollHeight;
    }
  }
  function logOK(m)   { logDebug('✅ ' + m, '#00FF41'); }
  function logWait(m) { logDebug('⏳ ' + m, '#ffffaa'); }
  function logFail(m) { logDebug('❌ ' + m, '#FF003C'); }
  function logInfo(m) { logDebug('ℹ️  ' + m, '#88ccff'); }

  function checkLibraries() {
    logInfo('--- ПРОВЕРКА БИБЛИОТЕК ---');
    if (typeof THREE === 'undefined') { logFail('THREE не найден!'); return false; }
    else logOK('THREE найден.');
    if (typeof THREE.GLTFLoader === 'undefined') { logFail('GLTFLoader не найден!'); return false; }
    else logOK('GLTFLoader найден!');
    return true;
  }

  async function checkFileExists(url) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return true;
      logFail(`Файл НЕ найден: ${url}`); return false;
    } catch (e) { logFail(`Сетевая ошибка: ${url}`); return false; }
  }

  async function checkAllFiles() {
    logInfo('--- ПРОВЕРКА ФАЙЛОВ ---');
    const all = [
      assets.textures.fog, ...assets.textures.roads, ...assets.textures.buildings,
      assets.models.player, assets.models.run, assets.models.jump,
      assets.models.fall, assets.models.dance1, assets.models.dance2, assets.video
    ];
    let ok = true;
    for (const u of all) { if (!(await checkFileExists(u))) ok = false; }
    return ok;
  }

  // ============================================================
  // ANIMATION FIX
  // ============================================================
  function fixAnimation(clip, targetModel) {
    if (!clip || !targetModel) return null;
    const validBones = [];
    targetModel.traverse(c => { if (c.isBone) validBones.push(c.name); });

    clip.tracks = clip.tracks.filter(track => {
      if (track.name.endsWith('.position')) return false;
      const parts = track.name.split('.');
      const prop = parts.pop();
      const trackBone = parts.join('.');
      let matched = null;
      for (const b of validBones) {
        if (trackBone.toLowerCase().endsWith(b.toLowerCase())) { matched = b; break; }
      }
      if (matched) { track.name = matched + '.' + prop; return true; }
      return false;
    });
    return clip;
  }

  // ============================================================
  // ASSET LOADING
  // ============================================================
  function loadGLTF(url) {
    return new Promise((resolve, reject) => {
      logWait('Грузим: ' + url);
      const dracoLoader = new THREE.DRACOLoader();
      dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
      const loader = new THREE.GLTFLoader();
      loader.setDRACOLoader(dracoLoader);
      loader.load(url, resolve, undefined, err => { logFail('ОШИБКА: ' + url); reject({ url, err }); });
    });
  }

  function loadTexture(url) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        tex => { tex.anisotropy = renderer?.capabilities?.getMaxAnisotropy() || 1; resolve(tex); },
        undefined,
        err => { logFail('ОШИБКА: ' + url); reject({ url, err }); }
      );
    });
  }

  async function preloadAssets() {
    try {
      if (!checkLibraries()) return;
      await checkAllFiles();
      logInfo('--- НАЧИНАЕМ ЗАГРУЗКУ ---');

      loadedTextures.fog = await loadTexture(assets.textures.fog);
      loadedTextures.roads = [];
      for (const u of assets.textures.roads) loadedTextures.roads.push(await loadTexture(u));
      loadedTextures.buildings = [];
      for (const u of assets.textures.buildings) loadedTextures.buildings.push(await loadTexture(u));

      loadedTextures.roads.forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 4);
      });
      loadedTextures.buildings.forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 5);
      });

      const playerGltf = await loadGLTF(assets.models.player);
      playerModel = playerGltf.scene;
      playerModel.scale.set(1, 1, 1);
      playerModel.position.set(0, 0, 0);
      mixer = new THREE.AnimationMixer(playerModel);

      function extractAnim(gltf, name) {
        if (!gltf.animations || gltf.animations.length === 0) {
          logFail('ПУСТОЙ ФАЙЛ: ' + name); return null;
        }
        return fixAnimation(gltf.animations[0], playerModel);
      }

      const runGltf   = await loadGLTF(assets.models.run);   animations['run']   = extractAnim(runGltf,   'running.glb');
      const jumpGltf  = await loadGLTF(assets.models.jump);  animations['jump']  = extractAnim(jumpGltf,  'jump.glb');
      const fallGltf  = await loadGLTF(assets.models.fall);  animations['fall']  = extractAnim(fallGltf,  'fall.glb');
      const d1Gltf    = await loadGLTF(assets.models.dance1); animations['dance1'] = extractAnim(d1Gltf,  'dance.glb');
      const d2Gltf    = await loadGLTF(assets.models.dance2); animations['dance2'] = extractAnim(d2Gltf,  'dance2.glb');

      logOK('=== ВСЕ ФАЙЛЫ ГОТОВЫ! ===');
      setTimeout(() => {
        debugPanel.style.display = 'none';
        setupWorld();
        startIntro();
      }, 1500);
    } catch (e) {
      logFail('КРИТИЧЕСКАЯ ОШИБКА: ' + (e.message || JSON.stringify(e)));
    }
  }

  // ============================================================
  // ANIMATION PLAYBACK
  // ============================================================
  function playAnim(name, fadeTime = 0.2) {
    if (!animations[name]) {
      // Fallback: если нет анимации, хотя бы покажем бег
      if (name !== 'run' && animations['run']) playAnim('run', fadeTime);
      return;
    }
    const action = mixer.clipAction(animations[name]);
    if (currentAction && currentAction !== action) currentAction.fadeOut(fadeTime);
    action.reset();
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(1);
    if (name === 'jump' || name === 'fall') {
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
    } else {
      action.setLoop(THREE.LoopRepeat);
    }
    action.fadeIn(fadeTime);
    action.play();
    currentAction = action;
  }

  // ============================================================
  // 3D INIT
  // ============================================================
  function init3D() {
    scene = new THREE.Scene();
    // Жуткий туман — темно-красный / почти чёрный
    scene.background = new THREE.Color(0x0a0005);
    scene.fog = new THREE.FogExp2(0x0a0005, 0.018);

    const width  = root.clientWidth  || window.innerWidth;
    const height = root.clientHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 500);
    dummyCamera = new THREE.PerspectiveCamera(70, width / height, 0.1, 500);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.6;
    root.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // Слабое красноватое освещение — как закат в аду
    const ambient = new THREE.AmbientLight(0x220011, 1.5);
    scene.add(ambient);

    // Основной жёлто-красный направленный свет
    const dirLight = new THREE.DirectionalLight(0xff4400, 2.0);
    dirLight.position.set(10, 30, -20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.far = 150;
    scene.add(dirLight);

    // Синий контр-свет
    const backLight = new THREE.DirectionalLight(0x0033ff, 0.3);
    backLight.position.set(-10, 5, 10);
    scene.add(backLight);

    // Точечный свет прямо под игроком — кровавое свечение
    const playerLight = new THREE.PointLight(0xff0000, 3, 12);
    playerLight.position.set(0, 1, 0);
    scene.add(playerLight);
    // Сохраняем ссылку чтобы двигать вместе с персонажем
    scene._playerLight = playerLight;

    setupControls();
    window.addEventListener('resize', onWindowResize, false);
  }

  // ============================================================
  // WORLD SETUP
  // ============================================================
  function setupWorld() {
    // --- Игрок ---
    playerGroup = new THREE.Group();
    playerGroup.position.set(targetX, PLAYER_Y_OFFSET, 0);
    playerGroup.add(playerModel);
    scene.add(playerGroup);

    // Тень под игроком — простой круг
    const shadowGeo = new THREE.CircleGeometry(0.8, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    playerGroup.add(shadow);

    // --- Дорога: пул сегментов ---
    // Используем только одну текстуру (самую тёмную)
    const roadTex = loadedTextures.roads[0];
    roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
    roadTex.repeat.set(1, 1);

    for (let i = 0; i < ROAD_SEG_COUNT; i++) {
      const geo = new THREE.PlaneGeometry(12, ROAD_SEG_LENGTH);
      const mat = new THREE.MeshStandardMaterial({
        map: roadTex,
        color: 0x330011,
        roughness: 1,
        metalness: 0
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.receiveShadow = true;
      // Размещаем сегменты один за другим в -Z
      mesh.position.z = -(i * ROAD_SEG_LENGTH) + ROAD_SEG_LENGTH / 2;
      mesh.position.y = 0;
      scene.add(mesh);
      roadPool.push(mesh);
    }

    // --- Небо / Купол ---
    const skyGeo = new THREE.SphereGeometry(300, 16, 8);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x0a0005,
      side: THREE.BackSide
    });
    skyDome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyDome);

    // --- Горизонтальный туман (ground fog plane) ---
    const gfGeo = new THREE.PlaneGeometry(40, 500);
    const gfMat = new THREE.MeshBasicMaterial({
      map: loadedTextures.fog,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    groundFog = new THREE.Mesh(gfGeo, gfMat);
    groundFog.rotation.x = -Math.PI / 2;
    groundFog.position.y = 0.1;
    scene.add(groundFog);

    // --- Здания (более мрачные) ---
    buildHorrorBuildings();

    // --- Пугала / инсталляции ---
    buildScarecrows();

    // --- Трещины на дороге (декоративные линии) ---
    buildCracks();

    // --- Геометрия препятствий и монет ---
    // Препятствие: шипастый додекаэдр — выглядит жутко
    obstacleGeo = new THREE.DodecahedronGeometry(1, 0);
    obstacleMat = new THREE.MeshStandardMaterial({
      color: 0x1a0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.8
    });
    // Монета: сохраняем октаэдр, но делаем кроваво-красным
    coinGeo = new THREE.OctahedronGeometry(0.5, 1);
    coinMat = new THREE.MeshStandardMaterial({
      color: 0xff2200,
      emissive: 0xff0000,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.9
    });
  }

  // --- HORROR BUILDINGS ---
  function buildHorrorBuildings() {
    const bTex = loadedTextures.buildings[0];
    for (let i = 0; i < 30; i++) {
      const height = 20 + Math.random() * 40;
      const width  = 5 + Math.random() * 4;
      const geo    = new THREE.BoxGeometry(width, height, 8);
      const mat    = new THREE.MeshStandardMaterial({
        map: bTex,
        color: 0x110008,
        roughness: 1,
        emissive: 0x110005,
        emissiveIntensity: 0.3
      });
      const b = new THREE.Mesh(geo, mat);
      const side = Math.random() > 0.5 ? 1 : -1;
      b.position.x = side * (9 + Math.random() * 6);
      b.position.y = height / 2;
      b.position.z = -(Math.random() * 250 + 10);
      b.castShadow = true;
      scene.add(b);
      buildings.push(b);

      // Случайные окна-глаза (эмиссивные прямоугольники)
      const winCount = Math.floor(Math.random() * 4) + 1;
      for (let w = 0; w < winCount; w++) {
        const wGeo = new THREE.PlaneGeometry(0.8, 1.2);
        const wMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
        const win  = new THREE.Mesh(wGeo, wMat);
        win.position.set(
          (Math.random() - 0.5) * (width - 1),
          (Math.random() - 0.5) * height * 0.6,
          4.1
        );
        b.add(win);
      }
    }
  }

  // --- SCARECROWS (простые фигуры из примитивов) ---
  function buildScarecrows() {
    for (let i = 0; i < 15; i++) {
      const group = new THREE.Group();

      // Тело
      const bodyGeo = new THREE.BoxGeometry(0.4, 1.2, 0.2);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x221100, roughness: 1 });
      group.add(new THREE.Mesh(bodyGeo, bodyMat));

      // Голова
      const headGeo = new THREE.SphereGeometry(0.25, 8, 6);
      const headMat = new THREE.MeshStandardMaterial({ color: 0x331100, roughness: 1 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 0.85;
      group.add(head);

      // Руки
      const armGeo = new THREE.BoxGeometry(1.2, 0.12, 0.12);
      const arm = new THREE.Mesh(armGeo, bodyMat);
      arm.position.y = 0.3;
      group.add(arm);

      // Красные глаза
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const eyeGeo = new THREE.SphereGeometry(0.06, 6, 4);
      [-0.1, 0.1].forEach(x => {
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(x, 0.9, 0.22);
        group.add(eye);
      });

      const side = Math.random() > 0.5 ? 1 : -1;
      group.position.set(
        side * (7 + Math.random() * 3),
        0.8,
        -(Math.random() * 250 + 20)
      );
      group.rotation.y = Math.random() * Math.PI;
      scene.add(group);
      scareCrows.push(group);
    }
  }

  // --- CRACKS (декоративные линии на дороге) ---
  function buildCracks() {
    const mat = new THREE.LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.3 });
    for (let i = 0; i < 40; i++) {
      const points = [];
      const z0 = -(Math.random() * 300 + 10);
      const x0 = (Math.random() - 0.5) * 10;
      points.push(new THREE.Vector3(x0, 0.05, z0));
      points.push(new THREE.Vector3(x0 + (Math.random() - 0.5) * 2, 0.05, z0 + Math.random() * 3));
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      cracks.push(line);
    }
  }

  // ============================================================
  // SCENARIOS
  // ============================================================
  function startIntro() {
    gameState = STATE.INTRO;
    loadingText.style.display = 'none';
    introText.style.display = 'block';

    camera.position.set(-5, 3, 3);
    camera.lookAt(playerGroup.position.x, 2, playerGroup.position.z);

    playAnim(Math.random() > 0.5 ? 'dance1' : 'dance2', 0.5);

    root.addEventListener('click', onIntroClick, { once: true });
  }

  function onIntroClick() {
    if (gameState !== STATE.INTRO) return;
    gameState = STATE.TRANSITION;
    introText.style.display = 'none';

    videoElement.style.display = 'block';
    videoElement.play().catch(() => {});

    setTimeout(() => startRun(), 2000);
  }

  function startRun() {
    gameState = STATE.PLAYING;
    videoElement.style.display = 'none';
    videoElement.pause();
    gameUI.style.display = 'flex';

    camera.position.set(0, 4, 7);
    camera.lookAt(playerGroup.position.x, 2, -10);

    playerGroup.rotation.y = Math.PI;
    playAnim('run', 0.2);
  }

  // ============================================================
  // CONTROLS
  // ============================================================
  function moveLeft()  { if (currentLane > 0 && gameState === STATE.PLAYING) { currentLane--; targetX = lanes[currentLane]; } }
  function moveRight() { if (currentLane < 2 && gameState === STATE.PLAYING) { currentLane++; targetX = lanes[currentLane]; } }
  function jump() {
    if (!isJumping && gameState === STATE.PLAYING) {
      isJumping = true;
      velocityY = jumpPower;
      playAnim('jump', 0.1);
    }
  }

  function handleKeyDown(e) {
    if (!running) return;
    if (['ArrowLeft',  'KeyA'].includes(e.code)) { e.preventDefault(); moveLeft(); }
    if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); moveRight(); }
    if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) { e.preventDefault(); jump(); }
  }

  let touchStartX = 0, touchStartY = 0;
  function handleTouchStart(e) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }
  function handleTouchEnd(e) {
    if (!running || gameState !== STATE.PLAYING) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) { if (Math.abs(dx) > 30) dx > 0 ? moveRight() : moveLeft(); }
    else { if (dy < -30) jump(); }
  }

  function setupControls() {
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    root.addEventListener('touchstart', handleTouchStart);
    root.addEventListener('touchend', handleTouchEnd);
  }

  // ============================================================
  // ROAD RECYCLING (ключевой фикс!)
  // ============================================================
  function updateRoad() {
    // Минимальный Z который сейчас видит камера (позиция игрока - небольшой запас впереди)
    const frontZ = playerGroup.position.z - ROAD_SEG_LENGTH * 2;

    roadPool.forEach(seg => {
      // Если сегмент оказался позади камеры — перемещаем его вперёд
      if (seg.position.z > playerGroup.position.z + ROAD_SEG_LENGTH) {
        // Найти самый передний (наименьший Z) и поставить ещё дальше
        let minZ = Infinity;
        roadPool.forEach(s => { if (s.position.z < minZ) minZ = s.position.z; });
        seg.position.z = minZ - ROAD_SEG_LENGTH;
      }
    });
  }

  // ============================================================
  // SPAWN
  // ============================================================
  function spawnRow() {
    const obsLane = Math.floor(Math.random() * 3);
    const obs = new THREE.Mesh(obstacleGeo, obstacleMat);
    obs.position.set(lanes[obsLane], 1, playerGroup.position.z - 100);
    obs.rotation.set(Math.random(), Math.random(), Math.random());
    scene.add(obs);
    // Точечный свет рядом с препятствием
    const oLight = new THREE.PointLight(0xff0000, 2, 6);
    oLight.position.copy(obs.position);
    scene.add(oLight);
    obs.userData.light = oLight;
    obstacles.push(obs);

    const coinLane = (obsLane + 1 + Math.floor(Math.random() * 2)) % 3;
    const coin = new THREE.Mesh(coinGeo, coinMat);
    coin.position.set(lanes[coinLane], 1.2, playerGroup.position.z - 90);
    scene.add(coin);
    coins.push(coin);
  }

  // ============================================================
  // GAME LOOP
  // ============================================================
  function animate() {
    if (!running) return;
    animationId = requestAnimationFrame(animate);

    const delta = clock ? clock.getDelta() : 0.016;
    if (mixer) mixer.update(delta);

    const t = Date.now() * 0.001;

    if (gameState === STATE.INTRO) {
      camera.position.x = Math.sin(t * 0.8) * 5;
      camera.position.z = Math.cos(t * 0.8) * 5 + 2;
      camera.lookAt(playerGroup.position.x, 2, playerGroup.position.z);
    }
    else if (gameState === STATE.PLAYING) {
      // Ускоряем медленно
      speed += 0.00005;

      // Двигаем игрока вперёд
      playerGroup.position.z -= speed;
      playerGroup.position.x += (targetX - playerGroup.position.x) * 0.15;

      // Прыжок
      if (isJumping) {
        playerGroup.position.y += velocityY;
        velocityY += gravity;
        if (playerGroup.position.y <= PLAYER_Y_OFFSET) {
          playerGroup.position.y = PLAYER_Y_OFFSET;
          isJumping = false;
          velocityY = 0;
          playAnim('run', 0.2);
        }
      }

      // Камера следует за игроком плавно
      const camTargetX = playerGroup.position.x * 0.4;
      const camTargetY = playerGroup.position.y + 4;
      const camTargetZ = playerGroup.position.z + 7;
      camera.position.x += (camTargetX - camera.position.x) * 0.1;
      camera.position.y += (camTargetY - camera.position.y) * 0.1;
      camera.position.z += (camTargetZ - camera.position.z) * 0.1;
      camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.5, playerGroup.position.z - 12);

      // Свет игрока
      if (scene._playerLight) {
        scene._playerLight.position.set(playerGroup.position.x, playerGroup.position.y + 1, playerGroup.position.z);
        // Пульсирует для атмосферы
        scene._playerLight.intensity = 2 + Math.sin(t * 8) * 0.5;
      }

      // Дорога — постоянно рециклируем
      updateRoad();

      // Небо и земля-туман движутся с игроком
      if (skyDome) skyDome.position.copy(playerGroup.position);
      if (groundFog) {
        groundFog.position.z = playerGroup.position.z - 50;
        // Медленно дрейфует
        groundFog.material.opacity = 0.25 + Math.sin(t * 0.5) * 0.1;
      }

      // Здания — рециклируем
      buildings.forEach(b => {
        if (b.position.z > playerGroup.position.z + 20) {
          const side = Math.random() > 0.5 ? 1 : -1;
          b.position.x = side * (9 + Math.random() * 6);
          b.position.z -= 250 + Math.random() * 50;
        }
      });

      // Пугала — рециклируем
      scareCrows.forEach(sc => {
        if (sc.position.z > playerGroup.position.z + 20) {
          const side = Math.random() > 0.5 ? 1 : -1;
          sc.position.x = side * (7 + Math.random() * 3);
          sc.position.z -= 260 + Math.random() * 60;
          // Немного поворачиваются — жуть
          sc.rotation.y = Math.random() * Math.PI;
        }
        // Пугала смотрят в сторону игрока (только по Y)
        sc.children[0]?.rotation && (sc.rotation.y += 0.005);
      });

      // Спавн
      spawnTimer += speed;
      if (spawnTimer > 12) { spawnRow(); spawnTimer = 0; }

      // Монеты
      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.rotation.y += 0.08;
        c.position.y = 1.2 + Math.sin(t * 3 + i) * 0.15;
        const inZ = Math.abs(c.position.z - playerGroup.position.z) < 1.2;
        const inX = Math.abs(c.position.x - playerGroup.position.x) < 1.2;
        const inY = playerGroup.position.y < 2.5;
        if (inZ && inX && inY) {
          scene.remove(c);
          coins.splice(i, 1);
          coinsCollected++;
          document.getElementById('cUi').innerText = 'КРОВЬ: ' + coinsCollected;
        } else if (c.position.z > camera.position.z + 5) {
          scene.remove(c);
          coins.splice(i, 1);
        }
      }

      // Препятствия
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.rotation.x += 0.02;
        obs.rotation.z += 0.01;
        const inZ = Math.abs(obs.position.z - playerGroup.position.z) < 1.3;
        const inX = Math.abs(obs.position.x - playerGroup.position.x) < 1.3;
        const inY = playerGroup.position.y < 2;
        if (inZ && inX && inY) {
          triggerDeath();
        } else if (obs.position.z > camera.position.z + 5) {
          if (obs.userData.light) scene.remove(obs.userData.light);
          scene.remove(obs);
          obstacles.splice(i, 1);
        }
      }

      score = Math.floor(Math.abs(playerGroup.position.z));
      document.getElementById('sUi').innerText = 'ОЧКИ: ' + score;
    }
    else if (gameState === STATE.DYING) {
      deathTimer++;

      // Камера медленно поворачивается к туману смерти
      dummyCamera.position.copy(camera.position);
      dummyCamera.lookAt(playerGroup.position.x, 3, playerGroup.position.z - 30);
      camera.quaternion.slerp(dummyCamera.quaternion, 0.05);

      // Туман надвигается
      if (fogMesh) {
        fogMesh.position.z -= deathTimer < 60 ? speed * 0.5 : speed * 10;
        fogMesh.lookAt(camera.position);
        if (fogMesh.position.z > playerGroup.position.z - 3) {
          running = false;
          overlayGameOver.style.display = 'flex';
          document.getElementById('goScore').innerText = score;
          document.getElementById('goCoins').innerText = '+' + coinsCollected;
        }
      } else {
        // Если fogMesh нет — просто показываем game over через 3 сек
        if (deathTimer > 120) {
          running = false;
          overlayGameOver.style.display = 'flex';
          document.getElementById('goScore').innerText = score;
          document.getElementById('goCoins').innerText = '+' + coinsCollected;
        }
      }

      // Красный флеш экрана
      if (uiLayer._deathOverlay) {
        uiLayer._deathOverlay.style.opacity = Math.min(deathTimer / 60, 0.7);
      }
    }

    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  // ============================================================
  // СМЕРТЬ
  // ============================================================
  function triggerDeath() {
    if (gameState === STATE.DYING) return;
    gameState = STATE.DYING;
    deathTimer = 0;
    playAnim('fall', 0.1);
    api.addCoins(coinsCollected);
    api.setHighScore(score);
    api.onUiUpdate();

    // Создаём туман смерти прямо впереди
    const fGeo = new THREE.PlaneGeometry(30, 25);
    const fMat = new THREE.MeshBasicMaterial({
      map: loadedTextures.fog,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });
    fogMesh = new THREE.Mesh(fGeo, fMat);
    fogMesh.position.set(playerGroup.position.x, 5, playerGroup.position.z - 50);
    scene.add(fogMesh);
  }

  // ============================================================
  // РЕСТАРТ
  // ============================================================
  function resetGame() {
    speed = 0.3;
    score = 0;
    coinsCollected = 0;
    currentLane = 1;
    targetX = lanes[currentLane];
    isJumping = false;
    velocityY = 0;
    deathTimer = 0;
    spawnTimer = 0;

    playerGroup.position.set(targetX, PLAYER_Y_OFFSET, 0);
    playerGroup.rotation.y = Math.PI;

    camera.position.set(0, 4, 7);
    camera.lookAt(0, 2, -10);

    obstacles.forEach(o => {
      if (o.userData.light) scene.remove(o.userData.light);
      scene.remove(o);
    });
    obstacles = [];
    coins.forEach(c => scene.remove(c));
    coins = [];

    if (fogMesh) { scene.remove(fogMesh); fogMesh = null; }

    // Сбрасываем дорогу
    roadPool.forEach((seg, i) => {
      seg.position.z = -(i * ROAD_SEG_LENGTH) + ROAD_SEG_LENGTH / 2;
    });

    overlayGameOver.style.display = 'none';
    if (uiLayer._deathOverlay) uiLayer._deathOverlay.style.opacity = 0;

    document.getElementById('sUi').innerText = 'ОЧКИ: 0';
    document.getElementById('cUi').innerText = 'КРОВЬ: 0';

    startRun();
    running = true;
    animate();
  }

  function onWindowResize() {
    if (!camera || !renderer || !root) return;
    const w = root.clientWidth || window.innerWidth;
    const h = root.clientHeight || window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (dummyCamera) { dummyCamera.aspect = w / h; dummyCamera.updateProjectionMatrix(); }
    renderer.setSize(w, h);
  }

  // ============================================================
  // UI
  // ============================================================
  function buildUI() {
    uiLayer = document.createElement('div');
    uiLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:10;font-family:Impact,sans-serif;';
    root.appendChild(uiLayer);

    // Красный оверлей при смерти
    const deathOverlay = document.createElement('div');
    deathOverlay.style.cssText = 'position:absolute;inset:0;background:rgba(180,0,0,1);opacity:0;transition:opacity 0.1s;pointer-events:none;';
    uiLayer.appendChild(deathOverlay);
    uiLayer._deathOverlay = deathOverlay;

    loadingText = document.createElement('div');
    loadingText.innerText = 'ЗАГРУЗКА УЖАСА...';
    loadingText.style.cssText = 'position:absolute;top:10%;left:50%;transform:translateX(-50%);color:#FF003C;font-size:22px;text-shadow:2px 2px 0 #000;font-family:monospace;white-space:nowrap;';
    uiLayer.appendChild(loadingText);

    debugPanel = document.createElement('div');
    debugPanel.style.cssText = 'position:absolute;top:18%;left:2%;right:2%;bottom:2%;background:rgba(0,0,0,0.92);border:2px solid #440000;overflow-y:auto;padding:12px;z-index:999;pointer-events:auto;font-family:monospace;font-size:12px;';
    uiLayer.appendChild(debugPanel);

    introText = document.createElement('div');
    introText.innerText = '☠ ТАП ЧТОБЫ БЕЖАТЬ ☠';
    introText.style.cssText = 'position:absolute;bottom:20%;left:50%;transform:translateX(-50%);color:#FF003C;font-size:34px;text-shadow:3px 3px 0 #000,0 0 20px #ff0000;display:none;animation:pulse 1s infinite alternate;cursor:pointer;pointer-events:auto;text-align:center;';
    uiLayer.appendChild(introText);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse { from { transform:translateX(-50%) scale(1); } to { transform:translateX(-50%) scale(1.08); } }
      @keyframes flicker { 0%,100%{opacity:1} 50%{opacity:0.7} }
    `;
    document.head.appendChild(style);

    videoElement = document.createElement('video');
    videoElement.src = assets.video;
    videoElement.playsInline = true;
    videoElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none;z-index:15;pointer-events:none;';
    root.appendChild(videoElement);

    gameUI = document.createElement('div');
    gameUI.style.cssText = 'position:absolute;top:15px;width:100%;display:none;justify-content:center;gap:30px;z-index:12;';
    gameUI.innerHTML = `
      <div id="sUi" style="color:#ff4400;font-size:22px;text-shadow:2px 2px 0 #000,0 0 10px #ff0000;">ОЧКИ: 0</div>
      <div id="cUi" style="color:#ff0000;font-size:22px;text-shadow:2px 2px 0 #000,0 0 10px #ff0000;">КРОВЬ: 0</div>
    `;
    uiLayer.appendChild(gameUI);

    // Кнопки на экране (мобильные)
    const mobileCtrl = document.createElement('div');
    mobileCtrl.style.cssText = 'position:absolute;bottom:20px;width:100%;display:flex;justify-content:space-between;padding:0 20px;box-sizing:border-box;z-index:12;pointer-events:auto;';
    mobileCtrl.innerHTML = `
      <button id="btnLeft"  style="width:70px;height:70px;font-size:28px;background:rgba(180,0,0,0.5);border:2px solid #ff0000;color:#fff;border-radius:50%;cursor:pointer;touch-action:none;">◀</button>
      <button id="btnJump"  style="width:70px;height:70px;font-size:22px;background:rgba(180,0,0,0.5);border:2px solid #ff0000;color:#fff;border-radius:50%;cursor:pointer;touch-action:none;">▲</button>
      <button id="btnRight" style="width:70px;height:70px;font-size:28px;background:rgba(180,0,0,0.5);border:2px solid #ff0000;color:#fff;border-radius:50%;cursor:pointer;touch-action:none;">▶</button>
    `;
    uiLayer.appendChild(mobileCtrl);
    mobileCtrl.querySelector('#btnLeft').addEventListener('touchstart',  e => { e.preventDefault(); moveLeft();  }, { passive: false });
    mobileCtrl.querySelector('#btnRight').addEventListener('touchstart', e => { e.preventDefault(); moveRight(); }, { passive: false });
    mobileCtrl.querySelector('#btnJump').addEventListener('touchstart',  e => { e.preventDefault(); jump();      }, { passive: false });
    // Тоже для мыши (десктоп)
    mobileCtrl.querySelector('#btnLeft').addEventListener('mousedown',  moveLeft);
    mobileCtrl.querySelector('#btnRight').addEventListener('mousedown', moveRight);
    mobileCtrl.querySelector('#btnJump').addEventListener('mousedown',  jump);

    overlayGameOver = document.createElement('div');
    overlayGameOver.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.93);z-index:20;display:none;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-shadow:2px 2px 0 #000;pointer-events:auto;';
    overlayGameOver.innerHTML = `
      <h1 style="font-size:44px;margin:0;color:#FF003C;text-align:center;animation:flicker 2s infinite;text-shadow:0 0 30px #ff0000;">☠ ТЫ МЕРТВЕЦ ☠</h1>
      <h2 style="margin:15px 0;color:#ff4400;">ОЧКИ: <span id="goScore">0</span></h2>
      <h2 style="color:#ff0000;margin:0;">КРОВЬ: <span id="goCoins">0</span></h2>
      <button id="btnRestart" style="margin-top:30px;padding:15px 40px;font-size:24px;background:#440000;color:#ff4400;border:2px solid #ff0000;cursor:pointer;font-family:Impact;letter-spacing:2px;text-shadow:0 0 10px #ff0000;">ЕЩЕ РАЗ</button>
    `;
    uiLayer.appendChild(overlayGameOver);
    overlayGameOver.querySelector('#btnRestart').addEventListener('click', resetGame);
  }

  // ============================================================
  // START / STOP
  // ============================================================
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
