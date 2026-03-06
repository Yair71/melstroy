export function createGame(root, api) {
  let running = false;
  let animationId;

  // --- CONFIGURATION ---
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
  let decorGroups = [];
  let worldGround;
  let farBackdrop;

  let loadedTextures = {};
  let obstacleGeo, obstacleMat;
  let coinGeo, coinMat;

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

  let velocityY = 0;
  const gravity = -0.015;
  const jumpPower = 0.3;
  let isJumping = false;
  let jumpAnimPlayed = false;
  let fallAnimPlayedInAir = false;

  let uiLayer, loadingText, debugPanel, introText, videoElement, gameUI, overlayGameOver;

  // ============================================================
  // DEBUG
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

  // ============================================================
  // LIBS / FILES CHECK
  // ============================================================
  function checkLibraries() {
    logInfo('--- ПРОВЕРКА БИБЛИОТЕК ---');

    if (typeof THREE === 'undefined') {
      logFail('THREE не найден! Скрипт three.min.js не загрузился.');
      return false;
    } else {
      logOK('THREE найден. Версия: r' + (THREE.REVISION || '???'));
    }

    if (typeof THREE.GLTFLoader === 'undefined') {
      logFail('THREE.GLTFLoader не найден!');
      return false;
    } else {
      logOK('THREE.GLTFLoader найден!');
    }

    if (typeof THREE.DRACOLoader === 'undefined') {
      logInfo('DRACOLoader не найден. Это ок, если модели не Draco-сжаты.');
    } else {
      logOK('THREE.DRACOLoader найден!');
    }

    return true;
  }

  async function checkFileExists(url) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) {
        logOK(`Файл найден (${res.status}): ${url}`);
        return true;
      } else {
        logFail(`Файл НЕ найден (${res.status}): ${url}`);
        return false;
      }
    } catch (e) {
      logFail(`Сетевая ошибка при проверке: ${url}`);
      logFail('Причина: ' + e.message);
      return false;
    }
  }

  async function checkAllFiles() {
    logInfo('--- ПРОВЕРКА НАЛИЧИЯ ФАЙЛОВ ---');

    const allFiles = [
      assets.textures.fog,
      ...assets.textures.roads,
      ...assets.textures.buildings,
      assets.models.player,
      assets.models.jump,
      assets.models.fall,
      assets.models.dance1,
      assets.models.dance2,
      assets.video
    ];

    let allOk = true;
    for (const url of allFiles) {
      const ok = await checkFileExists(url);
      if (!ok) allOk = false;
    }

    if (allOk) logOK('Все файлы найдены на сервере!');
    else logFail('ЕСТЬ ОТСУТСТВУЮЩИЕ ФАЙЛЫ — смотри красные строки выше!');

    return allOk;
  }

  // ============================================================
  // ANIMATION RETARGET FIX
  // ============================================================
  function normalizeBoneName(name) {
    return String(name || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/mixamorig[:_]/g, '')
      .replace(/armature[:_]/g, '')
      .replace(/skeleton[:_]/g, '')
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
      .map(track => {
        const lastDot = track.name.lastIndexOf('.');
        if (lastDot === -1) return null;

        const bonePart = track.name.slice(0, lastDot);
        const prop = track.name.slice(lastDot + 1);
        const matched = findClosestBoneName(bonePart, boneMap);
        if (!matched) return null;

        // убираем root position, чтобы модель не телепортировалась
        if (prop === 'position' && /hips|pelvis|root/i.test(matched)) return null;

        const t = track.clone();
        t.name = `${matched}.${prop}`;
        kept++;
        return t;
      })
      .filter(Boolean);

    if (kept === 0) {
      logFail(`Анимация "${clip.name || 'noname'}" не привязалась: 0/${total}`);
      return null;
    }

    logOK(`Анимация "${clip.name || 'noname'}" привязана: ${kept}/${total}`);
    return fixed;
  }

  function pickBestClip(gltf, kind) {
    if (!gltf.animations || gltf.animations.length === 0) return null;

    const clips = gltf.animations.slice();
    const k = String(kind || '').toLowerCase();

    function scoreClip(clip) {
      const n = String(clip.name || '').toLowerCase();
      let s = (clip.tracks?.length || 0) * 0.02;

      if (k === 'jump') {
        if (n.includes('jump')) s += 10;
        if (n.includes('fall')) s -= 3;
        if (n.includes('dance')) s -= 8;
        if (clip.duration > 3) s -= 2;
      }

      if (k === 'fall') {
        if (n.includes('fall')) s += 10;
        if (n.includes('land')) s += 4;
        if (n.includes('death')) s += 2;
        if (n.includes('dance')) s -= 8;
      }

      if (k === 'dance1' || k === 'dance2') {
        if (n.includes('dance')) s += 10;
      }

      return s;
    }

    clips.sort((a, b) => scoreClip(b) - scoreClip(a));
    return clips[0];
  }

  // ============================================================
  // ASSET LOADING
  // ============================================================
  function loadGLTF(url) {
    return new Promise((resolve, reject) => {
      logWait('Грузим 3D модель: ' + url);

      const loader = new THREE.GLTFLoader();

      if (typeof THREE.DRACOLoader !== 'undefined') {
        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
        loader.setDRACOLoader(dracoLoader);
      }

      loader.load(
        url,
        (gltf) => {
          logOK('Загружено: ' + url);
          resolve(gltf);
        },
        undefined,
        (error) => {
          logFail('ОШИБКА загрузки модели: ' + url);
          logFail('Сообщение: ' + (error.message || JSON.stringify(error)));
          reject({ url, error });
        }
      );
    });
  }

  function loadTexture(url) {
    return new Promise((resolve, reject) => {
      logWait('Грузим текстуру: ' + url);
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        (tex) => {
          tex.anisotropy = renderer?.capabilities?.getMaxAnisotropy?.() || 1;
          logOK('Загружено: ' + url);
          resolve(tex);
        },
        undefined,
        (error) => {
          logFail('ОШИБКА загрузки текстуры: ' + url);
          logFail('Сообщение: ' + (error.message || JSON.stringify(error)));
          reject({ url, error });
        }
      );
    });
  }

  function fitPlayerModelToHumanScale() {
    if (!playerModel) return;

    playerModel.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.frustumCulled = false;
      }
    });

    // сначала центрируем
    let box = new THREE.Box3().setFromObject(playerModel);
    const center = box.getCenter(new THREE.Vector3());
    playerModel.position.x -= center.x;
    playerModel.position.z -= center.z;

    // потом равномерно приводим к росту человека
    box = new THREE.Box3().setFromObject(playerModel);
    const height = box.max.y - box.min.y;

    if (height > 0.0001) {
      const targetHeight = 2.1; // человеческий размер в мире игры
      const s = targetHeight / height;
      playerModel.scale.setScalar(s);
    }

    // ставим ногами на землю
    box = new THREE.Box3().setFromObject(playerModel);
    playerModel.position.y -= box.min.y;

    const finalHeight = box.max.y - box.min.y;
    logInfo('Высота персонажа после нормализации: ' + finalHeight.toFixed(2));
  }

  async function preloadAssets() {
    try {
      const libsOk = checkLibraries();
      if (!libsOk) {
        if (loadingText) loadingText.innerHTML = '❌ ОШИБКА БИБЛИОТЕК<br>Смотри лог ниже 👇';
        return;
      }

      await checkAllFiles();

      logInfo('--- НАЧИНАЕМ ЗАГРУЗКУ ---');

      // textures
      loadedTextures.fog = await loadTexture(assets.textures.fog);

      loadedTextures.roads = [];
      for (let url of assets.textures.roads) {
        loadedTextures.roads.push(await loadTexture(url));
      }

      loadedTextures.buildings = [];
      for (let url of assets.textures.buildings) {
        loadedTextures.buildings.push(await loadTexture(url));
      }

      loadedTextures.roads.forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 10);
      });

      loadedTextures.buildings.forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 5);
      });

      // player = running.glb
      const playerGltf = await loadGLTF(assets.models.player);
      playerModel = playerGltf.scene;
      playerModel.scale.set(1, 1, 1);
      playerModel.position.set(0, 0, 0);

      fitPlayerModelToHumanScale();

      logInfo('Анимаций в running.glb: ' + playerGltf.animations.length);
      if (playerGltf.animations.length === 0) {
        logFail('В файле running.glb НЕТ анимаций! Проверь экспорт.');
      }

      mixer = new THREE.AnimationMixer(playerModel);
      animations['run'] = playerGltf.animations[0] || null;

      // jump
      const jumpGltf = await loadGLTF(assets.models.jump);
      logInfo('Анимаций в jump.glb: ' + jumpGltf.animations.length);
      const jumpClipRaw = pickBestClip(jumpGltf, 'jump');
      animations['jump'] = fixAnimation(jumpClipRaw, playerModel);

      // fall
      const fallGltf = await loadGLTF(assets.models.fall);
      logInfo('Анимаций в fall.glb: ' + fallGltf.animations.length);
      const fallClipRaw = pickBestClip(fallGltf, 'fall');
      animations['fall'] = fixAnimation(fallClipRaw, playerModel);

      // dances
      const dance1Gltf = await loadGLTF(assets.models.dance1);
      logInfo('Анимаций в dance.glb: ' + dance1Gltf.animations.length);
      const dance1Raw = pickBestClip(dance1Gltf, 'dance1');
      animations['dance1'] = fixAnimation(dance1Raw, playerModel);

      const dance2Gltf = await loadGLTF(assets.models.dance2);
      logInfo('Анимаций в dance2.glb: ' + dance2Gltf.animations.length);
      const dance2Raw = pickBestClip(dance2Gltf, 'dance2');
      animations['dance2'] = fixAnimation(dance2Raw, playerModel);

      if (!animations.jump) logFail('jump.glb не привязался к running.glb');
      if (!animations.fall) logFail('fall.glb не привязался к running.glb');
      if (!animations.dance1) logFail('dance.glb не привязался к running.glb');
      if (!animations.dance2) logFail('dance2.glb не привязался к running.glb');

      logOK('=== ВСЕ ФАЙЛЫ ЗАГРУЖЕНЫ! ===');

      setTimeout(() => {
        if (debugPanel) debugPanel.style.display = 'none';
        setupWorld();
        startIntro();
      }, 1200);

    } catch (e) {
      console.error("Asset loading error:", e);
      logFail('==============================');
      logFail('КРИТИЧЕСКАЯ ОШИБКА ЗАГРУЗКИ:');
      logFail(e.url ? 'Файл: ' + e.url : 'Неизвестный файл');
      logFail(e.error ? 'Детали: ' + (e.error.message || JSON.stringify(e.error)) : String(e));
      logFail('==============================');
      if (loadingText) loadingText.innerHTML = `❌ КРАШ ЗАГРУЗКИ<br>Смотри лог ниже 👇`;
    }
  }

  // ============================================================
  // ANIM PLAY
  // ============================================================
  function playAnim(name, fadeTime = 0.2) {
    if (!mixer) return;
    if (!animations[name]) {
      logFail('Анимация не найдена: ' + name);
      return;
    }

    const action = mixer.clipAction(animations[name]);

    if (name === 'jump' || name === 'fall') {
      if (currentAction && currentAction !== action) {
        currentAction.fadeOut(fadeTime);
      }
      action.reset();
      action.enabled = true;
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.fadeIn(fadeTime);
      action.play();
      currentAction = action;
      return;
    }

    if (currentAction && currentAction !== action) {
      currentAction.crossFadeTo(action, fadeTime, true);
    }

    action.reset();
    action.enabled = true;
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = false;
    action.play();
    currentAction = action;
  }

  // ============================================================
  // WORLD INIT
  // ============================================================
  function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    scene.fog = new THREE.Fog(0x222222, 10, 120);

    const width = root.clientWidth || window.innerWidth;
    const height = root.clientHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    dummyCamera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.82);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(10, 20, -10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    setupControls();
    window.addEventListener('resize', onWindowResize, false);
  }

  function createBuildingMaterial() {
    const tex = loadedTextures.buildings[Math.floor(Math.random() * loadedTextures.buildings.length)];
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 1,
      metalness: 0.04
    });
  }

  function clearDecorGroup(group) {
    while (group.children.length) {
      group.remove(group.children[0]);
    }
  }

  function populateDecorForSegment(group, segmentLen) {
    clearDecorGroup(group);

    // dark side lots so buildings no longer "float in void"
    const lotGeo = new THREE.PlaneGeometry(22, segmentLen);
    const lotMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 1, side: THREE.DoubleSide });

    const leftLot = new THREE.Mesh(lotGeo, lotMat);
    leftLot.rotation.x = -Math.PI / 2;
    leftLot.position.set(-17, -0.01, 0);
    leftLot.receiveShadow = true;
    group.add(leftLot);

    const rightLot = leftLot.clone();
    rightLot.position.x = 17;
    group.add(rightLot);

    // sidewalks
    const sidewalkGeo = new THREE.BoxGeometry(3.4, 0.25, segmentLen);
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 1 });

    const leftSidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    leftSidewalk.position.set(-8.7, 0.1, 0);
    leftSidewalk.receiveShadow = true;
    group.add(leftSidewalk);

    const rightSidewalk = leftSidewalk.clone();
    rightSidewalk.position.x = 8.7;
    group.add(rightSidewalk);

    // buildings
    for (let side of [-1, 1]) {
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const w = 5 + Math.random() * 4;
        const h = 14 + Math.random() * 28;
        const d = 7 + Math.random() * 6;

        const b = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, d),
          createBuildingMaterial()
        );

        b.position.x = side * (13 + Math.random() * 8);
        b.position.y = h * 0.5;
        b.position.z = -segmentLen * 0.5 + 10 + i * (segmentLen / count) + (Math.random() * 10 - 5);
        b.castShadow = true;
        b.receiveShadow = true;

        group.add(b);
        buildings.push(b);
      }
    }

    // lamp posts
    for (let side of [-1, 1]) {
      const lampCount = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < lampCount; i++) {
        const lamp = new THREE.Group();

        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 5.4, 8),
          new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
        );
        pole.position.y = 2.7;
        pole.castShadow = true;
        lamp.add(pole);

        const arm = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.08, 0.08),
          new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
        );
        arm.position.set(side * -0.35, 5.2, 0);
        lamp.add(arm);

        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 10, 10),
          new THREE.MeshBasicMaterial({ color: 0xffdd99 })
        );
        head.position.set(side * -0.75, 5.1, 0);
        lamp.add(head);

        lamp.position.set(side * 7.1, 0, -segmentLen * 0.5 + 16 + i * 40 + Math.random() * 10);
        group.add(lamp);
      }
    }

    // billboards
    if (Math.random() > 0.35) {
      for (let side of [-1, 1]) {
        if (Math.random() > 0.5) {
          const bb = new THREE.Group();

          const pole1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 4.4, 0.15),
            new THREE.MeshStandardMaterial({ color: 0x202020 })
          );
          pole1.position.set(-1.2, 2.2, 0);
          bb.add(pole1);

          const pole2 = pole1.clone();
          pole2.position.x = 1.2;
          bb.add(pole2);

          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 128;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#0e0e0e';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = Math.random() > 0.5 ? '#ff003c' : '#00FF41';
          ctx.font = 'bold 54px Impact';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const phrases = ['МУРИНО', 'БЕГИ', 'MEL LIVE', 'NO EXIT', 'СТРИМ'];
          ctx.fillText(phrases[Math.floor(Math.random() * phrases.length)], canvas.width / 2, canvas.height / 2);

          const tex = new THREE.CanvasTexture(canvas);
          const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(3.8, 1),
            new THREE.MeshBasicMaterial({ map: tex })
          );
          sign.position.y = 4.6;
          bb.add(sign);

          bb.position.set(side * 10.5, 0, -segmentLen * 0.5 + 26 + Math.random() * 40);
          group.add(bb);
        }
      }
    }
  }

  function setupWorld() {
    // player
    playerGroup = new THREE.Group();
    playerGroup.position.set(targetX, 0, 0);
    playerGroup.add(playerModel);
    scene.add(playerGroup);

    // global ground
    worldGround = new THREE.Mesh(
      new THREE.PlaneGeometry(250, 2600),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 })
    );
    worldGround.rotation.x = -Math.PI / 2;
    worldGround.position.set(0, -0.02, -1200);
    worldGround.receiveShadow = true;
    scene.add(worldGround);

    // far backdrop
    farBackdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 120),
      new THREE.MeshBasicMaterial({ color: 0x0d0d0d })
    );
    farBackdrop.position.set(0, 60, -900);
    scene.add(farBackdrop);

    // roads as groups
    roadMeshes = [];
    buildings = [];
    decorGroups = [];

    const ROAD_SEGMENTS = 6;
    const ROAD_LEN = 120;

    for (let i = 0; i < ROAD_SEGMENTS; i++) {
      const seg = new THREE.Group();
      seg.position.z = -i * ROAD_LEN;

      const tex = loadedTextures.roads[i % loadedTextures.roads.length];

      const roadGeo = new THREE.PlaneGeometry(12, ROAD_LEN);
      const roadMat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 1,
        metalness: 0
      });

      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.receiveShadow = true;
      seg.add(road);

      // lane markers
      const markerMat = new THREE.MeshStandardMaterial({
        color: 0xf2f2f2,
        emissive: 0x151515,
        side: THREE.DoubleSide
      });

      for (let laneX of [-1.5, 1.5]) {
        for (let z = -ROAD_LEN / 2 + 6; z < ROAD_LEN / 2; z += 12) {
          const marker = new THREE.Mesh(
            new THREE.PlaneGeometry(0.14, 5.2),
            markerMat
          );
          marker.rotation.x = -Math.PI / 2;
          marker.position.set(laneX, 0.01, z);
          seg.add(marker);
        }
      }

      // road barriers / curbs
      const curbGeo = new THREE.BoxGeometry(0.2, 0.5, ROAD_LEN);
      const curbMat = new THREE.MeshStandardMaterial({ color: 0x242424 });

      const leftCurb = new THREE.Mesh(curbGeo, curbMat);
      leftCurb.position.set(-6.1, 0.23, 0);
      leftCurb.receiveShadow = true;
      seg.add(leftCurb);

      const rightCurb = leftCurb.clone();
      rightCurb.position.x = 6.1;
      seg.add(rightCurb);

      // decor subgroup
      const decor = new THREE.Group();
      seg.add(decor);
      decorGroups.push(decor);

      populateDecorForSegment(decor, ROAD_LEN);

      scene.add(seg);
      roadMeshes.push(seg);
    }

    // fog – exactly in front like your logic
    fogEntity = new THREE.Mesh(
      new THREE.PlaneGeometry(25, 25),
      new THREE.MeshBasicMaterial({
        map: loadedTextures.fog,
        transparent: true,
        opacity: 0.98,
        depthWrite: false
      })
    );
    fogEntity.position.set(0, 5, 50);
    fogEntity.renderOrder = 999;
    scene.add(fogEntity);

    // shared obstacle / coin
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

    const danceName =
      animations['dance1'] && animations['dance2']
        ? (Math.random() > 0.5 ? 'dance1' : 'dance2')
        : 'run';

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

    jumpAnimPlayed = false;
    fallAnimPlayedInAir = false;
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
      jumpAnimPlayed = false;
      fallAnimPlayedInAir = false;

      if (animations['jump']) {
        playAnim('jump', 0.08);
        jumpAnimPlayed = true;
      }
    }
  }

  function handleKeyDown(e) {
    if (!running) return;
    if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); moveLeft(); }
    if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); moveRight(); }
    if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) { e.preventDefault(); jump(); }
  }

  let touchStartX = 0;
  let touchStartY = 0;

  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchEnd(e) {
    if (!running || gameState !== STATE.PLAYING) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) {
        dx > 0 ? moveRight() : moveLeft();
      }
    } else {
      if (dy < -30) jump();
    }
  }

  function setupControls() {
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    root.addEventListener('touchstart', handleTouchStart);
    root.addEventListener('touchend', handleTouchEnd);
  }

  // ============================================================
  // OBSTACLES / COINS
  // ============================================================
  function createObstacle(kind = 'block') {
    const g = new THREE.Group();

    if (kind === 'block') {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      m.position.y = 1;
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
      g.userData.hitX = 1.0;
      g.userData.hitZ = 1.0;
      g.userData.needJumpY = 2.0;
    }

    if (kind === 'barrier') {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 1.2, 0.9),
        new THREE.MeshStandardMaterial({ color: 0xd8d8d8 })
      );
      body.position.y = 0.6;
      body.castShadow = true;
      body.receiveShadow = true;
      g.add(body);

      for (let i = -1; i <= 1; i++) {
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 1.25, 0.08),
          new THREE.MeshStandardMaterial({ color: 0xff003c, emissive: 0x440010 })
        );
        stripe.position.set(i * 0.6, 0.6, 0.47);
        stripe.rotation.z = 0.55;
        g.add(stripe);
      }

      g.userData.hitX = 1.15;
      g.userData.hitZ = 0.55;
      g.userData.needJumpY = 1.7;
    }

    if (kind === 'dumpster') {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 1.5, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x1f2a2f })
      );
      body.position.y = 0.75;
      body.castShadow = true;
      body.receiveShadow = true;
      g.add(body);

      const lid = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 0.12, 1.45),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      lid.position.set(0, 1.52, 0);
      g.add(lid);

      g.userData.hitX = 1.1;
      g.userData.hitZ = 0.75;
      g.userData.needJumpY = 1.9;
    }

    if (kind === 'coneRow') {
      for (let i = -1; i <= 1; i++) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(0.32, 0.85, 10),
          new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0x331100 })
        );
        cone.position.set(i * 0.55, 0.42, 0);
        cone.castShadow = true;
        g.add(cone);
      }

      g.userData.hitX = 1.05;
      g.userData.hitZ = 0.5;
      g.userData.needJumpY = 1.2;
    }

    return g;
  }

  function spawnCoin(x, y, z) {
    const coin = new THREE.Mesh(coinGeo, coinMat);
    coin.position.set(x, y, z);
    coin.castShadow = true;
    coin.userData.baseY = y;
    coin.userData.phase = Math.random() * Math.PI * 2;
    scene.add(coin);
    coins.push(coin);
  }

  function spawnCoinsLine(laneIndex, startZ, count = 5, step = 3) {
    for (let i = 0; i < count; i++) {
      spawnCoin(lanes[laneIndex], 1.2 + (i % 2) * 0.15, startZ - i * step);
    }
  }

  function spawnRow() {
    const baseZ = playerGroup.position.z - 100;
    const pattern = Math.floor(Math.random() * 5);

    if (pattern === 0) {
      const obsLane = Math.floor(Math.random() * 3);
      const obs = createObstacle('block');
      obs.position.set(lanes[obsLane], 0, baseZ);
      scene.add(obs);
      obstacles.push(obs);

      const coinLane = (obsLane + 1 + Math.floor(Math.random() * 2)) % 3;
      spawnCoinsLine(coinLane, baseZ - 4, 4, 3);
    }

    if (pattern === 1) {
      const safeLane = Math.floor(Math.random() * 3);
      for (let lane = 0; lane < 3; lane++) {
        if (lane === safeLane) continue;
        const obs = createObstacle('barrier');
        obs.position.set(lanes[lane], 0, baseZ);
        scene.add(obs);
        obstacles.push(obs);
      }
      spawnCoinsLine(safeLane, baseZ - 5, 6, 2.8);
    }

    if (pattern === 2) {
      const obsLane = Math.floor(Math.random() * 3);
      const obs = createObstacle('dumpster');
      obs.position.set(lanes[obsLane], 0, baseZ);
      scene.add(obs);
      obstacles.push(obs);

      spawnCoinsLine(obsLane, baseZ - 10, 5, 2.7);
    }

    if (pattern === 3) {
      const laneA = Math.floor(Math.random() * 3);
      const laneB = (laneA + 1 + Math.floor(Math.random() * 2)) % 3;

      const obs1 = createObstacle('coneRow');
      obs1.position.set(lanes[laneA], 0, baseZ);
      scene.add(obs1);
      obstacles.push(obs1);

      const obs2 = createObstacle('block');
      obs2.position.set(lanes[laneB], 0, baseZ - 10);
      scene.add(obs2);
      obstacles.push(obs2);

      const freeLane = [0,1,2].find(v => v !== laneA && v !== laneB);
      spawnCoinsLine(freeLane, baseZ - 4, 5, 3);
    }

    if (pattern === 4) {
      for (let lane = 0; lane < 3; lane++) {
        spawnCoin(lanes[lane], 1.2, baseZ - lane * 3);
      }

      if (Math.random() > 0.5) {
        const obs = createObstacle('barrier');
        const lane = Math.floor(Math.random() * 3);
        obs.position.set(lanes[lane], 0, baseZ - 14);
        scene.add(obs);
        obstacles.push(obs);
      }
    }
  }

  // ============================================================
  // WORLD RESET / RECYCLE
  // ============================================================
  function resetWorldPositions() {
    const ROAD_LEN = 120;

    roadMeshes.forEach((seg, i) => {
      seg.position.z = -i * ROAD_LEN;
      const road = seg.children.find(c => c.isMesh && c.geometry && c.geometry.type === 'PlaneGeometry');
      if (road && loadedTextures.roads.length > 1 && road.material?.map) {
        const tex = loadedTextures.roads[Math.floor(Math.random() * loadedTextures.roads.length)];
        road.material.map = tex;
        road.material.needsUpdate = true;
      }
      const decor = decorGroups[i];
      if (decor) populateDecorForSegment(decor, ROAD_LEN);
    });

    if (worldGround) worldGround.position.z = -1200;
    if (farBackdrop) farBackdrop.position.z = -900;
    if (fogEntity) fogEntity.position.set(0, 5, 50);
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
      speed += 0.0001;
      playerGroup.position.z -= speed;
      playerGroup.position.x += (targetX - playerGroup.position.x) * 0.15;

      if (isJumping) {
        playerGroup.position.y += velocityY;
        velocityY += gravity;

        // в начале полёта jump
        if (!jumpAnimPlayed && animations['jump']) {
          playAnim('jump', 0.08);
          jumpAnimPlayed = true;
        }

        // на спуске fall
        if (velocityY < 0 && !fallAnimPlayedInAir && animations['fall']) {
          playAnim('fall', 0.08);
          fallAnimPlayedInAir = true;
        }

        if (playerGroup.position.y <= 0) {
          playerGroup.position.y = 0;
          isJumping = false;
          velocityY = 0;
          jumpAnimPlayed = false;
          fallAnimPlayedInAir = false;
          playAnim('run', 0.12);
        }
      }

      // camera
      camera.position.z = playerGroup.position.z + 7;
      camera.position.x = playerGroup.position.x * 0.5;
      camera.position.y = playerGroup.position.y + 4;
      camera.lookAt(playerGroup.position.x, 2, playerGroup.position.z - 10);

      // move global planes
      if (worldGround) worldGround.position.z = camera.position.z - 1200;
      if (farBackdrop) farBackdrop.position.z = camera.position.z - 900;

      // recycle roads
      const ROAD_LEN = 120;
      roadMeshes.forEach((seg, index) => {
        if (seg.position.z > camera.position.z + 10) {
          seg.position.z -= ROAD_LEN * roadMeshes.length;

          const roadMesh = seg.children.find(c =>
            c.isMesh &&
            c.geometry &&
            c.geometry.type === 'PlaneGeometry' &&
            c.material &&
            c.material.map
          );

          if (roadMesh) {
            const tex = loadedTextures.roads[Math.floor(Math.random() * loadedTextures.roads.length)];
            roadMesh.material.map = tex;
            roadMesh.material.needsUpdate = true;
          }

          const decor = decorGroups[index];
          if (decor) populateDecorForSegment(decor, ROAD_LEN);
        }
      });

      // spawn
      spawnTimer += delta * 60;
      if (spawnTimer > Math.max(20, 40 / speed)) {
        spawnRow();
        spawnTimer = 0;
      }

      // coins update
      const t = Date.now() * 0.004;
      coins.forEach(c => {
        c.rotation.y += 0.05;
        c.position.y = c.userData.baseY + Math.sin(t + c.userData.phase) * 0.12;
      });

      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        if (
          Math.abs(c.position.z - playerGroup.position.z) < 1.2 &&
          Math.abs(c.position.x - playerGroup.position.x) < 1.2 &&
          playerGroup.position.y < 2.8
        ) {
          scene.remove(c);
          coins.splice(i, 1);
          coinsCollected += 1;
          document.getElementById('cUi').innerText = 'CASH: ' + coinsCollected;
        } else if (c.position.z > camera.position.z + 6) {
          scene.remove(c);
          coins.splice(i, 1);
        }
      }

      // obstacles update
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        const hitX = obs.userData.hitX || 1.0;
        const hitZ = obs.userData.hitZ || 1.0;
        const needJumpY = obs.userData.needJumpY || 2.0;

        if (
          Math.abs(obs.position.z - playerGroup.position.z) < hitZ &&
          Math.abs(obs.position.x - playerGroup.position.x) < hitX &&
          playerGroup.position.y < needJumpY
        ) {
          triggerDeath();
          break;
        } else if (obs.position.z > camera.position.z + 6) {
          scene.remove(obs);
          obstacles.splice(i, 1);
        }
      }

      score = Math.floor(Math.abs(playerGroup.position.z));
      document.getElementById('sUi').innerText = 'SCORE: ' + score;

      // fog stays IN FRONT like your original idea
      fogEntity.position.set(0, 5, camera.position.z + 30);
      fogEntity.lookAt(camera.position);
    }

    else if (gameState === STATE.DYING) {
      deathTimer++;

      fogEntity.lookAt(camera.position);

      dummyCamera.position.copy(camera.position);
      dummyCamera.lookAt(fogEntity.position.x, fogEntity.position.y, fogEntity.position.z);
      camera.quaternion.slerp(dummyCamera.quaternion, 0.1);

      // сначала медленно, потом резко жрёт
      if (deathTimer < 90) {
        fogEntity.position.z -= Math.max(speed, 0.3) * 0.8;
      } else {
        fogEntity.position.z -= Math.max(speed, 0.3) * 8;
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
    if (gameState !== STATE.PLAYING) return;

    gameState = STATE.DYING;
    deathTimer = 0;

    if (animations['fall']) playAnim('fall', 0.08);

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
    deathTimer = 0;
    spawnTimer = 0;
    jumpAnimPlayed = false;
    fallAnimPlayedInAir = false;

    playerGroup.position.set(targetX, 0, 0);
    playerGroup.rotation.y = Math.PI;

    camera.position.set(0, 4, 7);
    camera.lookAt(playerGroup.position.x, 2, -10);

    obstacles.forEach(o => scene.remove(o));
    obstacles = [];

    coins.forEach(c => scene.remove(c));
    coins = [];

    resetWorldPositions();

    overlayGameOver.style.display = 'none';
    document.getElementById('sUi').innerText = 'SCORE: 0';
    document.getElementById('cUi').innerText = 'CASH: 0';

    if (mixer) mixer.stopAllAction();
    currentAction = null;

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
  // UI CREATION
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
