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
  let fogEntity;

  // Track segments (road + shoulders)
  let trackSegments = [];

  // Decorations
  let buildings = [];
  let obstacles = [];
  let coins = [];

  let loadedTextures = {};
  let obstacleGeo, obstacleMat;
  let coinGeo, coinMat;

  // Ground (infinite-ish)
  let worldGround;
  let farWall;

  // --- ROAD SETTINGS ---
  const ROAD_WIDTH = 12;
  const ROAD_LEN = 160;
  const ROAD_COUNT = 10;
  const ROAD_RECYCLE_BEHIND = 140; // ещё больше запас, чтобы вообще не видеть смену
const FOG_SIZE = 42;
const FOG_Y = (FOG_SIZE * 0.5) + 2; // чтобы низ не залезал в землю
  // --- GAME STATES ---
  const STATE = { LOADING: 0, INTRO: 1, TRANSITION: 2, PLAYING: 3, DYING: 4 };
  let gameState = STATE.LOADING;

  // --- LOGIC VARIABLES ---
  let speed = 0.3;
  let score = 0;
  let coinsCollected = 0;

  // DYING timing (seconds)
  let deathTime = 0;
  let fogChaseSpeed = 0;
  let fallClipDuration = 1.2;

  // For 1st-person head turn
  let deathFogSpawned = false;

  let spawnTimer = 0;

  const lanes = [-3, 0, 3];
  let currentLane = 1;
  let targetX = 0;

  const PLAYER_Y_OFFSET = 0;

  let velocityY = 0;
  const gravity = -0.015;
  const jumpPower = 0.3;
  let isJumping = false;

  let uiLayer, loadingText, debugPanel, introText, videoElement, gameUI, overlayGameOver;

  // ============================================================
  // 🔍 DEBUG PANEL
  // ============================================================
  function logDebug(msg, color = 'white') {
    console.log(msg);
    if (debugPanel) {
      const p = document.createElement('div');
      p.style.color = color;
      p.style.fontSize = '13px';
      p.style.fontFamily = 'monospace';
      p.style.textAlign = 'left';
      p.style.margin = '2px 0';
      p.style.wordBreak = 'break-all';
      p.style.textShadow = '1px 1px 0 #000';
      p.innerText = msg;
      debugPanel.appendChild(p);
      debugPanel.scrollTop = debugPanel.scrollHeight;
    }
  }

  function logOK(msg) { logDebug('✅ ' + msg, '#00FF41'); }
  function logWait(msg) { logDebug('⏳ ' + msg, '#ffffaa'); }
  function logFail(msg) { logDebug('❌ ' + msg, '#FF003C'); }
  function logInfo(msg) { logDebug('ℹ️  ' + msg, '#88ccff'); }

  function checkLibraries() {
    logInfo('--- ПРОВЕРКА БИБЛИОТЕК ---');
    if (typeof THREE === 'undefined') { logFail('THREE не найден!'); return false; }
    logOK('THREE найден.');

    if (typeof THREE.GLTFLoader === 'undefined') { logFail('GLTFLoader не найден!'); return false; }
    logOK('GLTFLoader найден.');

    if (typeof THREE.DRACOLoader === 'undefined') {
      logInfo('DRACOLoader не найден (ок, если модели не Draco-сжаты).');
    } else {
      logOK('DRACOLoader найден.');
    }
    return true;
  }

  async function checkFileExists(url) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return true;
      logFail(`Файл НЕ найден: ${url}`);
      return false;
    } catch (e) {
      logFail(`Сетевая ошибка/HEAD blocked: ${url}`);
      return false;
    }
  }

  async function checkAllFiles() {
    logInfo('--- ПРОВЕРКА НАЛИЧИЯ ФАЙЛОВ ---');
    const allFiles = [
      assets.textures.fog, ...assets.textures.roads, ...assets.textures.buildings,
      assets.models.player, assets.models.run, assets.models.jump, assets.models.fall, assets.models.dance1, assets.models.dance2,
      assets.video,
    ];
    let allOk = true;
    for (const url of allFiles) {
      const ok = await checkFileExists(url);
      if (!ok) allOk = false;
    }
    return allOk;
  }

  // ============================================================
  // ANIMATION RETARGET (smart-ish)
  // ============================================================
  function normalizeBoneName(name) {
    return name
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/mixamorig[:_]/g, '')
      .replace(/armature[:_]/g, '')
      .replace(/rig[:_]/g, '')
      .replace(/\|/g, '.')
      .replace(/:+/g, '.')
      .replace(/_+/g, '.')
      .replace(/\.+/g, '.')
      .trim();
  }

  function buildBoneMap(targetModel) {
    const byNorm = new Map();
    targetModel.traverse(o => {
      if (o.isBone) {
        const n = normalizeBoneName(o.name);
        if (!byNorm.has(n)) byNorm.set(n, o.name);
      }
    });
    return { byNorm };
  }

  function findClosestBoneName(trackBoneRaw, boneMap) {
    const normTrack = normalizeBoneName(trackBoneRaw);

    if (boneMap.byNorm.has(normTrack)) return boneMap.byNorm.get(normTrack);

    for (const [norm, real] of boneMap.byNorm.entries()) {
      if (norm.endsWith(normTrack) || normTrack.endsWith(norm)) return real;
    }

    const last = normTrack.split('.').pop();
    if (last) {
      for (const [norm, real] of boneMap.byNorm.entries()) {
        if (norm.split('.').pop() === last) return real;
      }
    }

    return null;
  }

  function fixAnimation(clip, targetModel) {
    if (!clip || !targetModel) return null;

    const boneMap = buildBoneMap(targetModel);
    const fixed = clip.clone();

    let kept = 0;
    const total = clip.tracks.length;

    fixed.tracks = fixed.tracks
      .filter(track => !track.name.endsWith('.position'))
      .map(track => {
        const lastDot = track.name.lastIndexOf('.');
        if (lastDot === -1) return null;

        const bonePart = track.name.slice(0, lastDot);
        const prop = track.name.slice(lastDot + 1);

        const matched = findClosestBoneName(bonePart, boneMap);
        if (!matched) return null;

        const t = track.clone();
        t.name = `${matched}.${prop}`;
        kept++;
        return t;
      })
      .filter(Boolean);

    if (kept === 0) {
      logFail(`Анимация "${clip.name || 'noname'}" → 0 треков. Возможно другой риг.`);
      return null;
    }

    logOK(`Анимация "${clip.name || 'noname'}" → треки: ${kept}/${total} (dur=${fixed.duration.toFixed(2)}s)`);
    return fixed;
  }

  // ============================================================
  // ASSET LOADING
  // ============================================================
  function loadGLTF(url) {
    return new Promise((resolve, reject) => {
      logWait('Грузим: ' + url);

      const loader = new THREE.GLTFLoader();

      if (typeof THREE.DRACOLoader !== 'undefined') {
        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
        loader.setDRACOLoader(dracoLoader);
      }

      loader.load(
        url,
        (gltf) => resolve(gltf),
        undefined,
        (error) => { logFail('ОШИБКА: ' + url); reject({ url, error }); }
      );
    });
  }

  function loadTexture(url) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        (tex) => {
          tex.anisotropy = renderer?.capabilities?.getMaxAnisotropy?.() || 1;
          resolve(tex);
        },
        undefined,
        (error) => { logFail('ОШИБКА: ' + url); reject({ url, error }); }
      );
    });
  }

  // 💥 ВАЖНО: фикс выбора клипа, чтобы jump/fall НЕ брали dance
  function pickBestClip(gltf, kind) {
    if (!gltf.animations || gltf.animations.length === 0) return null;

    const want = (kind || '').toLowerCase();

    // 1) If name matches hint — take it
    const named = gltf.animations.find(a => (a.name || '').toLowerCase().includes(want));
    if (named) return named;

    // 2) Otherwise score by duration and track count
    // Dances are usually long; jump/fall short. We use that.
    function scoreClip(a) {
      const dur = a.duration || 0;
      const tracks = (a.tracks && a.tracks.length) ? a.tracks.length : 0;

      let score = tracks * 0.03;

      if (want.includes('run')) {
        // prefer ~1s loop (avoid long dances)
        score -= Math.abs(dur - 1.0) * 2.0;
        if (dur > 3.0) score -= 8.0;
      }
      else if (want.includes('jump')) {
        // prefer short (0.2..2.5)
        if (dur > 3.0) score -= 12.0;
        score += (3.0 - Math.min(3.0, dur)) * 4.0;
      }
      else if (want.includes('fall')) {
        // prefer short-medium (0.4..3.0)
        if (dur > 4.0) score -= 12.0;
        score += (3.5 - Math.min(3.5, dur)) * 3.5;
      }
      else if (want.includes('dance')) {
        // prefer long
        score += Math.min(dur, 8.0) * 2.0;
        if (dur < 1.0) score -= 10.0;
      }

      return score;
    }

    let best = gltf.animations[0];
    let bestScore = scoreClip(best);

    for (const a of gltf.animations) {
      const s = scoreClip(a);
      if (s > bestScore) {
        best = a;
        bestScore = s;
      }
    }

    return best;
  }

  async function preloadAssets() {
    try {
      if (!checkLibraries()) return;
      await checkAllFiles();

      logInfo('--- НАЧИНАЕМ ЗАГРУЗКУ ---');

      loadedTextures.fog = await loadTexture(assets.textures.fog);

      loadedTextures.roads = [];
      for (let url of assets.textures.roads) loadedTextures.roads.push(await loadTexture(url));

      loadedTextures.buildings = [];
      for (let url of assets.textures.buildings) loadedTextures.buildings.push(await loadTexture(url));

      loadedTextures.roads.forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 14);
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

      function extractAnim(gltf, kindLabel) {
        const picked = pickBestClip(gltf, kindLabel);
        if (!picked) {
          logFail('❌ ПУСТОЙ ФАЙЛ/нет клипов: ' + kindLabel);
          return null;
        }
        logInfo(`🎞️ Выбран клип для "${kindLabel}": "${picked.name || 'noname'}" dur=${picked.duration.toFixed(2)}s`);
        return fixAnimation(picked, playerModel);
      }

      const runGltf = await loadGLTF(assets.models.run);
      animations.run = extractAnim(runGltf, 'run');

      const jumpGltf = await loadGLTF(assets.models.jump);
      animations.jump = extractAnim(jumpGltf, 'jump');

      const fallGltf = await loadGLTF(assets.models.fall);
      animations.fall = extractAnim(fallGltf, 'fall');

      const dance1Gltf = await loadGLTF(assets.models.dance1);
      animations.dance1 = extractAnim(dance1Gltf, 'dance');

      const dance2Gltf = await loadGLTF(assets.models.dance2);
      animations.dance2 = extractAnim(dance2Gltf, 'dance2');

      if (animations.fall) fallClipDuration = Math.max(0.8, animations.fall.duration || 1.2);

      logOK('=== ВСЕ ФАЙЛЫ ГОТОВЫ! ===');

      setTimeout(() => {
        debugPanel.style.display = 'none';
        setupWorld();
        startIntro();
      }, 900);

    } catch (e) {
      logFail('КРИТИЧЕСКАЯ ОШИБКА ЗАГРУЗКИ');
    }
  }

  // ============================================================
  // ANIM PLAY
  // ============================================================
 function playAnim(name, fadeTime = 0.12) {
  const clip = animations[name];
  if (!clip) { logFail('❌ Нет анимации: ' + name); return; }

  const next = mixer.clipAction(clip);

  // ВАЖНО: если это jump/fall — рубим всё, чтобы не “перемешивалось” с run/dance
  if (name === 'jump' || name === 'fall') {
    mixer.stopAllAction();
  } else if (currentAction && currentAction !== next) {
    currentAction.fadeOut(fadeTime);
  }

  next.reset();
  next.enabled = true;
  next.setEffectiveTimeScale(1);
  next.setEffectiveWeight(1);

  if (name === 'jump' || name === 'fall') {
    next.setLoop(THREE.LoopOnce, 1);
    next.clampWhenFinished = true;
  } else {
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = false;
  }

  next.fadeIn(fadeTime);
  next.play();

  currentAction = next;
}
  // ============================================================
  // 3D INIT
  // ============================================================
  function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x151515);
    scene.fog = new THREE.Fog(0x151515, 12, 160);

    const width = root.clientWidth || window.innerWidth;
    const height = root.clientHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1400);
    dummyCamera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1400);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    root.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 1.05);
    dir.position.set(10, 20, -10);
    dir.castShadow = true;
    scene.add(dir);

    setupControls();
    window.addEventListener('resize', onWindowResize, false);
  }

  // ============================================================
  // WORLD BUILD
  // ============================================================
  function setupWorld() {
    playerGroup = new THREE.Group();
    playerGroup.position.set(targetX, PLAYER_Y_OFFSET, 0);
    playerGroup.add(playerModel);
    scene.add(playerGroup);

    const groundGeo = new THREE.PlaneGeometry(700, 7000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0e0e0e });
    worldGround = new THREE.Mesh(groundGeo, groundMat);
    worldGround.rotation.x = -Math.PI / 2;
    worldGround.position.set(0, -0.02, -1500);
    worldGround.receiveShadow = true;
    scene.add(worldGround);

    farWall = new THREE.Mesh(
      new THREE.PlaneGeometry(900, 140),
      new THREE.MeshStandardMaterial({ color: 0x070707, emissive: 0x040404 })
    );
    farWall.position.set(0, 65, -1900);
    scene.add(farWall);

    const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LEN);
    const roadMatArr = loadedTextures.roads.map(tex => new THREE.MeshStandardMaterial({
      map: tex,
      side: THREE.DoubleSide,
      roughness: 1,
      metalness: 0
    }));

    const shoulderW = 18;
    const shoulderGeo = new THREE.PlaneGeometry(shoulderW, ROAD_LEN);
    const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x101010, side: THREE.DoubleSide });

    const markGeo = new THREE.PlaneGeometry(0.18, ROAD_LEN);
    const markMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee, emissive: 0x222222, transparent: true, opacity: 0.65, side: THREE.DoubleSide
    });

    const barrierGeo = new THREE.BoxGeometry(0.25, 0.7, ROAD_LEN);
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x090909 });

    for (let i = 0; i < ROAD_COUNT; i++) {
      const seg = new THREE.Group();
      seg.position.z = -i * ROAD_LEN;

      const road = new THREE.Mesh(roadGeo, roadMatArr[i % roadMatArr.length]);
      road.rotation.x = -Math.PI / 2;
      road.position.y = 0;
      road.receiveShadow = true;
      road.frustumCulled = false;
      seg.add(road);
      seg.userData.road = road;

      const leftS = new THREE.Mesh(shoulderGeo, shoulderMat);
      leftS.rotation.x = -Math.PI / 2;
      leftS.position.set(-(ROAD_WIDTH / 2 + shoulderW / 2), -0.001, 0);
      leftS.receiveShadow = true;
      leftS.frustumCulled = false;
      seg.add(leftS);

      const rightS = leftS.clone();
      rightS.position.x = (ROAD_WIDTH / 2 + shoulderW / 2);
      seg.add(rightS);

      const m1 = new THREE.Mesh(markGeo, markMat);
      m1.rotation.x = -Math.PI / 2;
      m1.position.set(-1.5, 0.002, 0);
      m1.frustumCulled = false;
      seg.add(m1);

      const m2 = m1.clone();
      m2.position.x = 1.5;
      seg.add(m2);

      const bL = new THREE.Mesh(barrierGeo, barrierMat);
      bL.position.set(-(ROAD_WIDTH / 2 + 0.15), 0.35, 0);
      bL.frustumCulled = false;
      seg.add(bL);

      const bR = bL.clone();
      bR.position.x = (ROAD_WIDTH / 2 + 0.15);
      seg.add(bR);

      scene.add(seg);
      trackSegments.push(seg);
    }

   fogEntity = new THREE.Mesh(
  new THREE.PlaneGeometry(FOG_SIZE, FOG_SIZE),
  new THREE.MeshBasicMaterial({
    map: loadedTextures.fog,
    transparent: true,
    opacity: 0.98,
    depthWrite: false
  })
);
fogEntity.position.set(0, FOG_Y, 50);
fogEntity.renderOrder = 999;
fogEntity.frustumCulled = false;
scene.add(fogEntity);
    const maxBuildings = 90;
    const bGeo = new THREE.BoxGeometry(6, 40, 10);

    for (let i = 0; i < maxBuildings; i++) {
      const tex = loadedTextures.buildings[Math.floor(Math.random() * loadedTextures.buildings.length)];
      const bMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1 });
      const b = new THREE.Mesh(bGeo, bMat);

      const side = Math.random() > 0.5 ? 1 : -1;
      const dist = 18 + Math.random() * 65;
      b.position.x = side * dist;

      const h = 18 + Math.random() * 70;
      b.scale.y = h / 40;

      b.position.y = (40 * b.scale.y) / 2;
      b.position.z = -(Math.random() * 2600);

      b.castShadow = true;
      b.receiveShadow = true;

      scene.add(b);
      buildings.push(b);
    }

    obstacleGeo = new THREE.BoxGeometry(2, 2, 2);
    obstacleMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    coinGeo = new THREE.OctahedronGeometry(0.6);
    coinMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xaa8800 });
  }

  // ============================================================
  // SCENARIOS
  // ============================================================
  function startIntro() {
    gameState = STATE.INTRO;
    loadingText.style.display = 'none';
    introText.style.display = 'block';

    camera.position.set(-6, 3, 2);
    camera.lookAt(playerGroup.position.x, 2, playerGroup.position.z);

    const danceName = Math.random() > 0.5 ? 'dance1' : 'dance2';
    playAnim(danceName, 0.15);

    root.addEventListener('click', onIntroClick, { once: true });
  }

 function onIntroClick() {
  if (gameState !== STATE.INTRO) return;

  // Сразу убираем интро UI
  introText.style.display = 'none';

  // Сразу убираем видео (если ты не хочешь задержку)
  videoElement.style.display = 'none';
  videoElement.pause();

  // СТОПАЕМ танец сразу
  if (mixer) mixer.stopAllAction();
  currentAction = null;

  // Сразу стартуем игру
  startRun();
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

    fogEntity.position.set(0, 7, camera.position.z + 60);
  }

  // ============================================================
  // CONTROLS
  // ============================================================
  function moveLeft() {
    if (currentLane > 0 && gameState === STATE.PLAYING) {
      currentLane--;
      targetX = lanes[currentLane];
    }
  }
  function moveRight() {
    if (currentLane < 2 && gameState === STATE.PLAYING) {
      currentLane++;
      targetX = lanes[currentLane];
    }
  }
  function jump() {
    if (!isJumping && gameState === STATE.PLAYING) {
      isJumping = true;
      velocityY = jumpPower;
      playAnim('jump', 0.08);
    }
  }

  function handleKeyDown(e) {
    if (!running) return;
    if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); moveLeft(); }
    if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); moveRight(); }
    if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) { e.preventDefault(); jump(); }
  }

  let touchStartX = 0; let touchStartY = 0;
  function handleTouchStart(e) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }
  function handleTouchEnd(e) {
    if (!running || gameState !== STATE.PLAYING) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) { dx > 0 ? moveRight() : moveLeft(); }
    } else {
      if (dy < -30) jump();
    }
  }

  function setupControls() {
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    root.addEventListener('touchstart', handleTouchStart);
    root.addEventListener('touchend', handleTouchEnd);
  }

  function spawnRow() {
    const obsLane = Math.floor(Math.random() * 3);
    const obs = new THREE.Mesh(obstacleGeo, obstacleMat);
    obs.position.set(lanes[obsLane], 1, playerGroup.position.z - 120);
    scene.add(obs);
    obstacles.push(obs);

    const coinLane = Math.floor(Math.random() * 3);
    if (coinLane !== obsLane) {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.position.set(lanes[coinLane], 1, playerGroup.position.z - 120);
      scene.add(coin);
      coins.push(coin);
    }
  }

  // ============================================================
  // GAME LOOP
  // ============================================================
  function animate() {
    if (!running) return;
    animationId = requestAnimationFrame(animate);

    const delta = clock ? clock.getDelta() : 0;
    if (mixer) mixer.update(delta);

    if (gameState === STATE.INTRO) {
      camera.position.x = Math.sin(Date.now() * 0.001) * 6;
      camera.position.z = Math.cos(Date.now() * 0.001) * 6 + 2;
      camera.lookAt(playerGroup.position.x, 2, playerGroup.position.z);
    }

    else if (gameState === STATE.PLAYING) {
      speed += 0.00012;

      playerGroup.position.z -= speed;
      playerGroup.position.x += (targetX - playerGroup.position.x) * 0.15;

      if (isJumping) {
        playerGroup.position.y += velocityY;
        velocityY += gravity;
        if (playerGroup.position.y <= PLAYER_Y_OFFSET) {
          playerGroup.position.y = PLAYER_Y_OFFSET;
          isJumping = false;
          velocityY = 0;
          playAnim('run', 0.15);
        }
      }

      // Camera (back view)
      camera.position.z = playerGroup.position.z + 7;
      camera.position.x = playerGroup.position.x; // строго сзади, без половинного X
      camera.position.y = playerGroup.position.y + 4;
      camera.lookAt(playerGroup.position.x, 2, playerGroup.position.z - 10);

      if (worldGround) worldGround.position.z = camera.position.z - 1500;
      if (farWall) farWall.position.z = camera.position.z - 2000;

      // Fog hidden behind
      fogEntity.position.set(playerGroup.position.x, 7, camera.position.z + 70);

      // ROAD RECYCLE (невидимый)
      let frontMostZ = Infinity;
      for (const seg of trackSegments) frontMostZ = Math.min(frontMostZ, seg.position.z);

      for (const seg of trackSegments) {
        const frontEdgeZ = seg.position.z - (ROAD_LEN * 0.5);
        if (frontEdgeZ > camera.position.z + ROAD_RECYCLE_BEHIND) {
          seg.position.z = frontMostZ - ROAD_LEN;
          frontMostZ = seg.position.z;

          const road = seg.userData.road;
          if (road && loadedTextures.roads.length > 1) {
            const idx = Math.floor(Math.random() * loadedTextures.roads.length);
            road.material.map = loadedTextures.roads[idx];
            road.material.needsUpdate = true;
          }
        }
      }

      spawnTimer += 1;
      if (spawnTimer > (48 / speed)) { spawnRow(); spawnTimer = 0; }

      coins.forEach(c => c.rotation.y += 0.05);

      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        if (
          Math.abs(c.position.z - playerGroup.position.z) < 1.2 &&
          Math.abs(c.position.x - playerGroup.position.x) < 1.2 &&
          playerGroup.position.y < 2.5
        ) {
          scene.remove(c); coins.splice(i, 1);
          coinsCollected += 1;
          document.getElementById('cUi').innerText = 'CASH: ' + coinsCollected;
        } else if (c.position.z > camera.position.z + 40) {
          scene.remove(c); coins.splice(i, 1);
        }
      }

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (
          Math.abs(obs.position.z - playerGroup.position.z) < 1.2 &&
          Math.abs(obs.position.x - playerGroup.position.x) < 1.2 &&
          playerGroup.position.y < 2
        ) {
          triggerDeath();
          break;
        } else if (obs.position.z > camera.position.z + 40) {
          scene.remove(obs); obstacles.splice(i, 1);
        }
      }

      for (const b of buildings) {
        if (b.position.z > camera.position.z + 120) {
          b.position.z = camera.position.z - (2000 + Math.random() * 1200);
          const side = Math.random() > 0.5 ? 1 : -1;
          const dist = 18 + Math.random() * 65;
          b.position.x = side * dist;

          const h = 18 + Math.random() * 70;
          b.scale.y = h / 40;
          b.position.y = (40 * b.scale.y) / 2;

          const tex = loadedTextures.buildings[Math.floor(Math.random() * loadedTextures.buildings.length)];
          b.material.map = tex;
          b.material.needsUpdate = true;
        }
      }

      score = Math.floor(Math.abs(playerGroup.position.z));
      document.getElementById('sUi').innerText = 'SCORE: ' + score;
    }

    else if (gameState === STATE.DYING) {
      deathTime += delta;

      // ✅ 1) ПАДЕНИЕ: держим камеру сзади минимум (fallClipDuration + запас)
      const FALL_SHOW_TIME = Math.max(2.0, fallClipDuration + 0.5);

      // ✅ 2) “Поворот головы” от 1-го лица
      const HEAD_TURN_TIME = 1.0;

      // ✅ 3) Смотреть на fog 2–3 сек
      const WATCH_FOG_TIME = 2.7;

      // Phase A: fall from back view
      if (deathTime < FALL_SHOW_TIME) {
        camera.position.z = playerGroup.position.z + 7.2;
        camera.position.x = playerGroup.position.x;       // строго сзади
        camera.position.y = playerGroup.position.y + 3.8; // чуть ниже — падение видно
        camera.lookAt(playerGroup.position.x, 1.8, playerGroup.position.z - 9);

        // fog скрыт далеко
        fogEntity.position.set(playerGroup.position.x, FOG_Y, camera.position.z + 80);
        fogEntity.lookAt(camera.position);
      }
      // Phase B: first-person + head turn to fog
      else {
        // 1st person head position (approx)
        const headX = playerGroup.position.x;
        const headY = playerGroup.position.y + 2.05;
        const headZ = playerGroup.position.z + 0.3;

        camera.position.set(headX, headY, headZ);

        // Spawn fog behind (once)
        if (!deathFogSpawned) {
          fogEntity.position.set(headX, headY + 0.6, headZ + 65);
          fogChaseSpeed = 0;
          deathFogSpawned = true;
        }

        // Forward look quaternion
        dummyCamera.position.set(headX, headY, headZ);
        dummyCamera.lookAt(headX, headY, headZ - 10);
        const qForward = dummyCamera.quaternion.clone();

        // Look at fog quaternion
        dummyCamera.position.set(headX, headY, headZ);
        dummyCamera.lookAt(fogEntity.position.x, fogEntity.position.y, fogEntity.position.z);
        const qToFog = dummyCamera.quaternion.clone();

        const tTurn = Math.min(1, (deathTime - FALL_SHOW_TIME) / HEAD_TURN_TIME);

        // Smooth head turn
        camera.quaternion.copy(qForward).slerp(qToFog, tTurn);

        // Move fog toward player while we watch it
        const tWatch = deathTime - FALL_SHOW_TIME - HEAD_TURN_TIME;

        if (tWatch >= 0) {
          fogChaseSpeed += delta * 10;          // ускорение
          const chase = 18 + fogChaseSpeed;     // скорость приближения
          fogEntity.position.z -= chase * delta;

          fogEntity.lookAt(camera.position);

          // End conditions: time OR close distance
          const dz = Math.abs(fogEntity.position.z - camera.position.z);
          const maxWatch = WATCH_FOG_TIME;

          if (tWatch > maxWatch || dz < 3.0) {
            running = false;
            overlayGameOver.style.display = 'flex';
            document.getElementById('goScore').innerText = score;
            document.getElementById('goCoins').innerText = '+' + coinsCollected;
          }
        } else {
          // before watch phase starts, just keep fog visible but not moving much
          fogEntity.lookAt(camera.position);
        }
      }
    }

    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  function triggerDeath() {
    if (gameState !== STATE.PLAYING) return;

    gameState = STATE.DYING;
    deathTime = 0;
    fogChaseSpeed = 0;
    deathFogSpawned = false;

    // stop movement so fall is visible
    speed = 0;

    playAnim('fall', 0.05);

    api.addCoins(coinsCollected);
    api.setHighScore(score);
    api.onUiUpdate();
  }

  function resetGame() {
    speed = 0.3;
    score = 0;
    coinsCollected = 0;

    currentLane = 1;
    targetX = lanes[currentLane];

    isJumping = false;
    velocityY = 0;

    deathTime = 0;
    fogChaseSpeed = 0;
    deathFogSpawned = false;
    spawnTimer = 0;

    playerGroup.position.set(targetX, PLAYER_Y_OFFSET, 0);

    camera.position.set(0, 4, 7);
    camera.lookAt(playerGroup.position.x, 2, -10);

    obstacles.forEach(o => scene.remove(o)); obstacles = [];
    coins.forEach(c => scene.remove(c)); coins = [];

    overlayGameOver.style.display = 'none';
    document.getElementById('sUi').innerText = 'SCORE: 0';
    document.getElementById('cUi').innerText = 'CASH: 0';

    startRun();
    running = true;
    animate();
  }

  function onWindowResize() {
    if (!camera || !renderer || !root) return;
    const width = root.clientWidth || window.innerWidth;
    const height = root.clientHeight || window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (dummyCamera) {
      dummyCamera.aspect = width / height;
      dummyCamera.updateProjectionMatrix();
    }
    renderer.setSize(width, height);
  }

  // ============================================================
  // UI
  // ============================================================
  function buildUI() {
    uiLayer = document.createElement('div');
    uiLayer.style.position = 'absolute';
    uiLayer.style.inset = '0';
    uiLayer.style.pointerEvents = 'none';
    uiLayer.style.zIndex = '10';
    uiLayer.style.fontFamily = 'Impact';
    root.appendChild(uiLayer);

    loadingText = document.createElement('div');
    loadingText.innerText = 'ЗАГРУЗКА ХАЙПА...';
    loadingText.style.cssText =
      'position:absolute; top:10%; left:50%; transform:translateX(-50%); color:#FF003C; font-size:24px; text-shadow:2px 2px 0 #000; text-align:center; font-family: monospace; line-height: 1.5; white-space:nowrap;';
    uiLayer.appendChild(loadingText);

    debugPanel = document.createElement('div');
    debugPanel.style.cssText = `
      position: absolute;
      top: 18%;
      left: 2%;
      right: 2%;
      bottom: 2%;
      background: rgba(0,0,0,0.92);
      border: 2px solid #444;
      overflow-y: auto;
      padding: 12px;
      z-index: 999;
      pointer-events: auto;
      font-family: monospace;
      font-size: 13px;
    `;
    uiLayer.appendChild(debugPanel);

    introText = document.createElement('div');
    introText.innerText = 'ТАПАЙ ПО ЭКРАНУ!';
    introText.style.cssText =
      'position:absolute; bottom:20%; left:50%; transform:translateX(-50%); color:#00FF41; font-size:40px; text-shadow:3px 3px 0 #000; display:none; animation: pulse 1s infinite alternate; cursor:pointer; pointer-events:auto;';
    uiLayer.appendChild(introText);

    const style = document.createElement('style');
    style.innerHTML = `@keyframes pulse { from { transform: translateX(-50%) scale(1); } to { transform: translateX(-50%) scale(1.1); } }`;
    document.head.appendChild(style);

    videoElement = document.createElement('video');
    videoElement.src = assets.video;
    videoElement.playsInline = true;
    videoElement.style.cssText =
      'position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:none; z-index:15; pointer-events:none;';
    root.appendChild(videoElement);

    gameUI = document.createElement('div');
    gameUI.style.cssText =
      'position:absolute; top:15px; width:100%; display:none; justify-content:center; gap:30px; z-index:12; text-shadow:2px 2px 0 #000;';
    gameUI.innerHTML =
      `<div id="sUi" style="color:#fff; font-size:24px;">SCORE: 0</div><div id="cUi" style="color:#00FF41; font-size:24px;">CASH: 0</div>`;
    uiLayer.appendChild(gameUI);

    overlayGameOver = document.createElement('div');
    overlayGameOver.style.cssText =
      'position:absolute; inset:0; background:rgba(0,0,0,0.9); z-index:20; display:none; flex-direction:column; align-items:center; justify-content:center; color:#fff; text-shadow:2px 2px 0 #000; pointer-events:auto;';
    overlayGameOver.innerHTML = `
      <h1 style="font-size:40px; margin:0; color:#FF003C; text-align:center;">ФОГ СЪЕЛ!</h1>
      <h2 style="margin:10px 0;">SCORE: <span id="goScore">0</span></h2>
      <h2 style="color:#00FF41; margin:0;">КЭШ: <span id="goCoins">0</span></h2>
      <button id="btnRestart" class="btn" style="margin-top:30px; padding: 15px 40px; font-size:24px;">ЕЩЕ РАЗ</button>
    `;
    uiLayer.appendChild(overlayGameOver);
    overlayGameOver.querySelector('#btnRestart').addEventListener('click', resetGame);
  }

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
      root.innerHTML = "";
    }
  };
}
