function createGame(root, api) {

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

  let roadMeshes = [];

  let buildings = [];

  let obstacles = [];

  let coins = [];



  let loadedTextures = {};

  let obstacleGeo, obstacleMat;

  let coinGeo, coinMat;



  // --- ROAD SETTINGS (for stable recycle) ---

  const ROAD_WIDTH = 12;

  const ROAD_LEN = 120;

  const ROAD_COUNT = 6;



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

  const jumpPower = 0.3;

  let isJumping = false;



  let uiLayer, loadingText, debugPanel, introText, videoElement, gameUI, overlayGameOver;



  // ============================================================

  // 🔍 ДИАГНОСТИЧЕСКАЯ ПАНЕЛЬ

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

    else { logOK('THREE найден.'); }

    if (typeof THREE.GLTFLoader === 'undefined') { logFail('GLTFLoader не найден!'); return false; }

    else { logOK('GLTFLoader найден!'); }

    return true;

  }



  async function checkFileExists(url) {

    try {

      const res = await fetch(url, { method: 'HEAD' });

      if (res.ok) { return true; }

      else { logFail(`Файл НЕ найден: ${url}`); return false; }

    } catch (e) { logFail(`Сетевая ошибка: ${url}`); return false; }

  }



  async function checkAllFiles() {

    logInfo('--- ПРОВЕРКА НАЛИЧИЯ ФАЙЛОВ ---');

    const allFiles = [

      assets.textures.fog, ...assets.textures.roads, ...assets.textures.buildings,

      assets.models.player, assets.models.run, assets.models.jump, assets.models.fall, assets.models.dance1, assets.models.dance2,

      assets.video,

    ];

    let allOk = true;

    for (const url of allFiles) { const ok = await checkFileExists(url); if (!ok) allOk = false; }

    return allOk;

  }



  // ============================================================

  // УМНЫЙ ФИКС АНИМАЦИЙ (ретаргет по костям)

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



  function buildBoneMaps(targetModel) {

    const bones = [];

    targetModel.traverse(o => { if (o.isBone) bones.push(o); });



    const byExact = new Map();

    const byNorm = new Map();



    for (const b of bones) {

      byExact.set(b.name, b.name);

      const n = normalizeBoneName(b.name);

      if (!byNorm.has(n)) byNorm.set(n, b.name);

    }

    return { bones, byExact, byNorm };

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



    const boneMap = buildBoneMaps(targetModel);

    let kept = 0;

    let total = clip.tracks.length;



    const fixed = clip.clone();



    fixed.tracks = fixed.tracks

      .filter(track => {

        if (track.name.endsWith('.position')) return false;

        return true;

      })

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

      logFail(`Анимация "${clip.name || 'noname'}" → 0 треков после привязки. Скорее всего другой риг.`);

      return null;

    }



    logOK(`Анимация "${clip.name || 'noname'}" → треки: ${kept}/${total}`);

    return fixed;

  }



  // ============================================================

  // ЗАГРУЗКА АССЕТОВ

  // ============================================================

  function loadGLTF(url) {

    return new Promise((resolve, reject) => {

      logWait('Грузим: ' + url);

      const dracoLoader = new THREE.DRACOLoader();

      dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');

      const loader = new THREE.GLTFLoader();

      loader.setDRACOLoader(dracoLoader);

      loader.load(url,

        (gltf) => { resolve(gltf); },

        undefined,

        (error) => { logFail('ОШИБКА: ' + url); reject({ url, error }); }

      );

    });

  }



  function loadTexture(url) {

    return new Promise((resolve, reject) => {

      const loader = new THREE.TextureLoader();

      loader.load(url,

        (tex) => { tex.anisotropy = renderer?.capabilities?.getMaxAnisotropy() || 1; resolve(tex); },

        undefined,

        (error) => { logFail('ОШИБКА: ' + url); reject({ url, error }); }

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

      for (let url of assets.textures.roads) loadedTextures.roads.push(await loadTexture(url));

      loadedTextures.buildings = [];

      for (let url of assets.textures.buildings) loadedTextures.buildings.push(await loadTexture(url));



      loadedTextures.roads.forEach(tex => { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, 10); });

      loadedTextures.buildings.forEach(tex => { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 5); });



      // 1. Грузим ОСНОВНОЕ ТЕЛО

      const playerGltf = await loadGLTF(assets.models.player);

      playerModel = playerGltf.scene;

      playerModel.scale.set(1, 1, 1);

      playerModel.position.set(0, 0, 0);

      mixer = new THREE.AnimationMixer(playerModel);



      function pickBestClip(gltf, fallbackName) {

        if (!gltf.animations || gltf.animations.length === 0) return null;



        const want = (fallbackName || '').toLowerCase();

        let best = gltf.animations.find(a => (a.name || '').toLowerCase().includes(want));

        if (best) return best;



        best = gltf.animations.reduce((acc, a) => (a.duration > acc.duration ? a : acc), gltf.animations[0]);

        return best;

      }



      // Вспомогательная функция, которая ловит ПУСТЫЕ файлы

      function extractAnim(gltf, label) {

        const clip = pickBestClip(gltf, label);

        if (!clip) {

          logFail('❌ ПУСТОЙ ФАЙЛ: внутри ' + label + ' нет анимаций!');

          return null;

        }

        return fixAnimation(clip, playerModel);

      }



      // 2. Грузим и чистим все анимации

      const runGltf = await loadGLTF(assets.models.run);

      animations['run'] = extractAnim(runGltf, 'run');



      const jumpGltf = await loadGLTF(assets.models.jump);

      animations['jump'] = extractAnim(jumpGltf, 'jump');



      const fallGltf = await loadGLTF(assets.models.fall);

      animations['fall'] = extractAnim(fallGltf, 'fall');



      const dance1Gltf = await loadGLTF(assets.models.dance1);

      animations['dance1'] = extractAnim(dance1Gltf, 'dance');



      const dance2Gltf = await loadGLTF(assets.models.dance2);

      animations['dance2'] = extractAnim(dance2Gltf, 'dance');



      logOK('=== ВСЕ ФАЙЛЫ ГОТОВЫ! ===');



      setTimeout(() => {

        debugPanel.style.display = 'none';

        setupWorld();

        startIntro();

      }, 2000);



    } catch (e) {

      logFail('КРИТИЧЕСКАЯ ОШИБКА ЗАГРУЗКИ');

    }

  }



  // ============================================================

  // ПЛАВНОЕ ВОСПРОИЗВЕДЕНИЕ (Без залипаний)

  // ============================================================

  function playAnim(name, fadeTime = 0.2) {

    const clip = animations[name];

    if (!clip) { logFail('❌ Блок анимации недоступен: ' + name); return; }



    const next = mixer.clipAction(clip);



    if (name === 'jump' || name === 'fall') {

      next.setLoop(THREE.LoopOnce, 1);

      next.clampWhenFinished = true;

    } else {

      next.setLoop(THREE.LoopRepeat, Infinity);

      next.clampWhenFinished = false;

    }



    next.reset();

    next.enabled = true;

    next.setEffectiveTimeScale(1);

    next.setEffectiveWeight(1);



    if (currentAction && currentAction !== next) {

      currentAction.crossFadeTo(next, fadeTime, false);

    }



    next.play();

    currentAction = next;



    logInfo(`🎬 playAnim: ${name}`);

  }



  // --- 2. WORLD INIT ---

  function init3D() {

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x222222);

    scene.fog = new THREE.Fog(0x222222, 10, 80);



    const width = root.clientWidth || window.innerWidth;

    const height = root.clientHeight || window.innerHeight;



    camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);

    dummyCamera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);



    renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(width, height);

    renderer.shadowMap.enabled = true;

    root.appendChild(renderer.domElement);



    clock = new THREE.Clock();



    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);

    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);

    dirLight.position.set(10, 20, -10);

    dirLight.castShadow = true;

    scene.add(dirLight);



    setupControls();

    window.addEventListener('resize', onWindowResize, false);

  }



  function setupWorld() {

    playerGroup = new THREE.Group();

    playerGroup.position.set(targetX, PLAYER_Y_OFFSET, 0);

    playerGroup.add(playerModel);

    scene.add(playerGroup);



    for (let i = 0; i < ROAD_COUNT; i++) {

      const tex = loadedTextures.roads[i % loadedTextures.roads.length];

      const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LEN);

      const roadMat = new THREE.MeshStandardMaterial({ map: tex });

      const road = new THREE.Mesh(roadGeo, roadMat);

      road.rotation.x = -Math.PI / 2;

      road.position.z = -i * ROAD_LEN;

      road.receiveShadow = true;

      scene.add(road);

      roadMeshes.push(road);

    }



    fogEntity = new THREE.Mesh(

      new THREE.PlaneGeometry(25, 25),

      new THREE.MeshBasicMaterial({ map: loadedTextures.fog, transparent: true })

    );

    fogEntity.position.set(0, 5, 50);

    scene.add(fogEntity);



    const bGeo = new THREE.BoxGeometry(6, 40, 10);

    for (let i = 0; i < 20; i++) {

      const tex = loadedTextures.buildings[Math.floor(Math.random() * loadedTextures.buildings.length)];

      const bMat = new THREE.MeshStandardMaterial({ map: tex });

      const b = new THREE.Mesh(bGeo, bMat);

      b.position.z = -(Math.random() * 200);

      b.position.x = Math.random() > 0.5 ? 12 : -12;

      b.position.y = 20;

      scene.add(b);

      buildings.push(b);

    }



    obstacleGeo = new THREE.BoxGeometry(2, 2, 2);

    obstacleMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

    coinGeo = new THREE.OctahedronGeometry(0.6);

    coinMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xaa8800 });



    // --- EXTRA WORLD (чтобы не было пусто) ---

    const sideGeo = new THREE.PlaneGeometry(200, 2000);

    const sideMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    const leftGround = new THREE.Mesh(sideGeo, sideMat);

    leftGround.rotation.x = -Math.PI / 2;

    leftGround.position.set(-40, -0.01, -600);

    scene.add(leftGround);



    const rightGround = leftGround.clone();

    rightGround.position.x = 40;

    scene.add(rightGround);



    const farWall = new THREE.Mesh(

      new THREE.PlaneGeometry(250, 80),

      new THREE.MeshStandardMaterial({ color: 0x0c0c0c, emissive: 0x050505 })

    );

    farWall.position.set(0, 40, -1200);

    scene.add(farWall);



    const dustCount = 600;

    const dustGeo = new THREE.BufferGeometry();

    const dustPos = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {

      dustPos[i * 3 + 0] = (Math.random() - 0.5) * 40;

      dustPos[i * 3 + 1] = Math.random() * 12 + 1;

      dustPos[i * 3 + 2] = -Math.random() * 300;

    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x666666, size: 0.08 }));

    dust.name = 'dust';

    scene.add(dust);

  }



  // --- 3. SCENARIOS ---

  function startIntro() {

    gameState = STATE.INTRO;

    loadingText.style.display = 'none';

    introText.style.display = 'block';



    camera.position.set(-6, 3, 2);

    camera.lookAt(playerGroup.position.x, 2, playerGroup.position.z);



    const danceName = Math.random() > 0.5 ? 'dance1' : 'dance2';

    playAnim(danceName, 0.5);



    root.addEventListener('click', onIntroClick, { once: true });

  }



  function onIntroClick() {

    if (gameState !== STATE.INTRO) return;

    gameState = STATE.TRANSITION;

    introText.style.display = 'none';



    videoElement.style.display = 'block';

    videoElement.play().catch(e => console.log("Video autoplay blocked", e));



    setTimeout(() => { startRun(); }, 2000);

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



    fogEntity.position.set(0, 5, camera.position.z + 30);

  }



  // --- 4. CONTROLS ---

  function moveLeft() { if (currentLane > 0 && gameState === STATE.PLAYING) { currentLane--; targetX = lanes[currentLane]; } }

  function moveRight() { if (currentLane < 2 && gameState === STATE.PLAYING) { currentLane++; targetX = lanes[currentLane]; } }

  function jump() {

    if (!isJumping && gameState === STATE.PLAYING) {

      isJumping = true; velocityY = jumpPower;

      playAnim('jump', 0.1);

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

    } else { if (dy < -30) jump(); }

  }



  function setupControls() {

    window.addEventListener('keydown', handleKeyDown, { passive: false });

    root.addEventListener('touchstart', handleTouchStart);

    root.addEventListener('touchend', handleTouchEnd);

  }



  function spawnRow() {

    const obsLane = Math.floor(Math.random() * 3);

    const obs = new THREE.Mesh(obstacleGeo, obstacleMat);

    obs.position.set(lanes[obsLane], 1, playerGroup.position.z - 100);

    scene.add(obs);

    obstacles.push(obs);



    const coinLane = Math.floor(Math.random() * 3);

    if (coinLane !== obsLane) {

      const coin = new THREE.Mesh(coinGeo, coinMat);

      coin.position.set(lanes[coinLane], 1, playerGroup.position.z - 100);

      scene.add(coin);

      coins.push(coin);

    }

  }



  // --- 5. GAME LOOP ---

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

      speed += 0.0001;

      playerGroup.position.z -= speed;

      playerGroup.position.x += (targetX - playerGroup.position.x) * 0.15;



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



      camera.position.z = playerGroup.position.z + 7;

      camera.position.x = playerGroup.position.x * 0.5;

      camera.position.y = playerGroup.position.y + 4;

      camera.lookAt(playerGroup.position.x, 2, playerGroup.position.z - 10);



      // --- ROAD RECYCLE (без дырок) ---

      let minZ = Infinity;

      for (const r of roadMeshes) minZ = Math.min(minZ, r.position.z);



      for (const r of roadMeshes) {

        if (r.position.z > camera.position.z + 30) {

          r.position.z = minZ - ROAD_LEN;

          minZ = r.position.z;

        }

      }



      spawnTimer++;

      if (spawnTimer > 40 / speed) { spawnRow(); spawnTimer = 0; }



      coins.forEach(c => c.rotation.y += 0.05);



      for (let i = coins.length - 1; i >= 0; i--) {

        const c = coins[i];

        if (Math.abs(c.position.z - playerGroup.position.z) < 1.2 && Math.abs(c.position.x - playerGroup.position.x) < 1.2 && playerGroup.position.y < 2.5) {

          scene.remove(c); coins.splice(i, 1);

          coinsCollected += 1;

          document.getElementById('cUi').innerText = 'CASH: ' + coinsCollected;

        } else if (c.position.z > camera.position.z) { scene.remove(c); coins.splice(i, 1); }

      }



      for (let i = obstacles.length - 1; i >= 0; i--) {

        const obs = obstacles[i];

        if (Math.abs(obs.position.z - playerGroup.position.z) < 1.2 && Math.abs(obs.position.x - playerGroup.position.x) < 1.2 && playerGroup.position.y < 2) {

          triggerDeath();

        } else if (obs.position.z > camera.position.z) { scene.remove(obs); obstacles.splice(i, 1); }

      }



      buildings.forEach(b => { if (b.position.z > camera.position.z + 10) b.position.z -= 200; });



      score = Math.floor(Math.abs(playerGroup.position.z));

      document.getElementById('sUi').innerText = 'SCORE: ' + score;



      fogEntity.position.set(0, 5, camera.position.z + 30);



      // --- dust follows camera ---

      const dust = scene.getObjectByName('dust');

      if (dust) dust.position.z = camera.position.z - 50;



    }

    else if (gameState === STATE.DYING) {

      deathTimer++;

      fogEntity.lookAt(camera.position);

      dummyCamera.position.copy(camera.position);

      dummyCamera.lookAt(fogEntity.position.x, fogEntity.position.y, fogEntity.position.z);

      camera.quaternion.slerp(dummyCamera.quaternion, 0.1);



      if (deathTimer < 90) {

        fogEntity.position.z -= speed * 0.8;

      } else {

        fogEntity.position.z -= speed * 8;

      }



      if (fogEntity.position.z < camera.position.z + 2) {

        running = false;

        overlayGameOver.style.display = 'flex';

        document.getElementById('goScore').innerText = score;

        document.getElementById('goCoins').innerText = '+' + coinsCollected;

      }

    }



    if (renderer && scene && camera) renderer.render(scene, camera);

  }



  function triggerDeath() {

    gameState = STATE.DYING;

    deathTimer = 0;

    playAnim('fall', 0.1);

    api.addCoins(coinsCollected);

    api.setHighScore(score);

    api.onUiUpdate();

  }



  function resetGame() {

    speed = 0.3; score = 0; coinsCollected = 0;

    currentLane = 1; targetX = lanes[currentLane];

    isJumping = false; velocityY = 0; deathTimer = 0;



    playerGroup.position.set(targetX, PLAYER_Y_OFFSET, 0);

    camera.position.set(0, 4, 7);

    camera.lookAt(playerGroup.position.x, 2, -10);



    obstacles.forEach(o => scene.remove(o)); obstacles = [];

    coins.forEach(c => scene.remove(c)); coins = [];

    buildings.forEach(b => b.position.z = -(Math.random() * 200));



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

    camera.aspect = width / height; camera.updateProjectionMatrix();

    if (dummyCamera) { dummyCamera.aspect = width / height; dummyCamera.updateProjectionMatrix(); }

    renderer.setSize(width, height);

  }



  // --- 6. UI CREATION ---

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

    loadingText.style.cssText = 'position:absolute; top:10%; left:50%; transform:translateX(-50%); color:#FF003C; font-size:24px; text-shadow:2px 2px 0 #000; text-align:center; font-family: monospace; line-height: 1.5; white-space:nowrap;';

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

    introText.style.cssText = 'position:absolute; bottom:20%; left:50%; transform:translateX(-50%); color:#00FF41; font-size:40px; text-shadow:3px 3px 0 #000; display:none; animation: pulse 1s infinite alternate; cursor:pointer; pointer-events:auto;';

    uiLayer.appendChild(introText);



    const style = document.createElement('style');

    style.innerHTML = `@keyframes pulse { from { transform: translateX(-50%) scale(1); } to { transform: translateX(-50%) scale(1.1); } }`;

    document.head.appendChild(style);



    videoElement = document.createElement('video');

    videoElement.src = assets.video;

    videoElement.playsInline = true;

    videoElement.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:none; z-index:15; pointer-events:none;';

    root.appendChild(videoElement);



    gameUI = document.createElement('div');

    gameUI.style.cssText = 'position:absolute; top:15px; width:100%; display:none; justify-content:center; gap:30px; z-index:12; text-shadow:2px 2px 0 #000;';

    gameUI.innerHTML = `<div id="sUi" style="color:#fff; font-size:24px;">SCORE: 0</div><div id="cUi" style="color:#00FF41; font-size:24px;">CASH: 0</div>`;

    uiLayer.appendChild(gameUI);



    overlayGameOver = document.createElement('div');

    overlayGameOver.style.cssText = 'position:absolute; inset:0; background:rgba(0,0,0,0.9); z-index:20; display:none; flex-direction:column; align-items:center; justify-content:center; color:#fff; text-shadow:2px 2px 0 #000; pointer-events:auto;';

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
