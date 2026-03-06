export function createGame(root, api) {
  let running = false;
  let animationId = 0;

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

  let scene, camera, renderer, dummyCamera, clock;
  let playerGroup, playerModel, mixer;
  let currentAction = null;
  let uiLayer, loadingText, debugPanel, introText, videoElement, gameUI, overlayGameOver;
  let scoreEl, cashEl, goScoreEl, goCoinsEl;
  let leftBtn, jumpBtn, rightBtn;

  const animations = {
    run: null,
    jump: null,
    fall: null,
    dance1: null,
    dance2: null
  };

  const STATE = {
    LOADING: 0,
    INTRO: 1,
    PLAYING: 2,
    DYING: 3,
    GAMEOVER: 4
  };

  let gameState = STATE.LOADING;

  const lanes = [-3.2, 0, 3.2];
  let currentLane = 1;
  let targetX = lanes[currentLane];

  const PLAYER_Y_OFFSET = 0;
  let velocityY = 0;
  let isJumping = false;
  let airState = 'ground';
  let deathStarted = false;
  let deathTime = 0;
  let deathFogSpawned = false;

  let speed = 0.34;
  let score = 0;
  let coinsCollected = 0;
  let nextSpawnDistance = 26;
  let difficultyLevel = 0;

  const ROAD_WIDTH = 12;
  const ROAD_LEN = 150;
  const ROAD_COUNT = 10;
  const ROAD_RECYCLE_BEHIND = 120;

  const GRAVITY = -0.028;
  const JUMP_POWER = 0.48;
  const MAX_SPEED = 1.12;

  let trackSegments = [];
  let obstacles = [];
  let coins = [];
  let worldGround = null;
  let fogGroup = null;
  let farBackdrop = null;

  let loadedTextures = {
    fog: null,
    roads: [],
    buildings: [],
    billboards: []
  };

  const shared = {
    obstacleGeo: null,
    coneGeo: null,
    coinGeo: null,
    sidewalkMat: null,
    curbMat: null,
    poleMat: null,
    neonMat: null,
    darkMat: null,
    glowMat: null,
    trashMat: null,
    glassMat: null,
    barrierMat: null,
    carBodyMat: null,
    lampLightMat: null,
    signMats: []
  };

  function logDebug(msg, color = 'white') {
    console.log(msg);
    if (!debugPanel) return;
    const p = document.createElement('div');
    p.style.color = color;
    p.style.fontSize = '13px';
    p.style.fontFamily = 'monospace';
    p.style.textAlign = 'left';
    p.style.margin = '2px 0';
    p.style.wordBreak = 'break-word';
    p.style.textShadow = '1px 1px 0 #000';
    p.innerText = msg;
    debugPanel.appendChild(p);
    debugPanel.scrollTop = debugPanel.scrollHeight;
  }

  const logOK = (msg) => logDebug('✅ ' + msg, '#00FF41');
  const logWait = (msg) => logDebug('⏳ ' + msg, '#fff0a6');
  const logFail = (msg) => logDebug('❌ ' + msg, '#ff5478');
  const logInfo = (msg) => logDebug('ℹ️  ' + msg, '#88ccff');

  function checkLibraries() {
    logInfo('--- ПРОВЕРКА БИБЛИОТЕК ---');
    if (typeof THREE === 'undefined') {
      logFail('THREE не найден');
      return false;
    }
    if (typeof THREE.GLTFLoader === 'undefined') {
      logFail('GLTFLoader не найден');
      return false;
    }
    logOK('THREE и GLTFLoader найдены');
    if (typeof THREE.DRACOLoader !== 'undefined') {
      logOK('DRACOLoader найден');
    } else {
      logInfo('DRACOLoader не найден (это ок, если модели не сжаты Draco)');
    }
    return true;
  }

  async function checkFileExists(url) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return true;
      logFail(`Файл не найден: ${url}`);
      return false;
    } catch (e) {
      logFail(`HEAD/сеть не дали проверить: ${url}`);
      return false;
    }
  }

  async function checkAllFiles() {
    const allFiles = [
      assets.textures.fog,
      ...assets.textures.roads,
      ...assets.textures.buildings,
      assets.models.player,
      assets.models.run,
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
    return allOk;
  }

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
    targetModel.traverse((obj) => {
      if (obj.isBone) {
        const n = normalizeBoneName(obj.name);
        if (!byNorm.has(n)) byNorm.set(n, obj.name);
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

  function isRootLikeBone(name) {
    const n = normalizeBoneName(name);
    return n.includes('hips') || n.includes('pelvis') || n.includes('root');
  }

  function fixAnimation(clip, targetModel) {
    if (!clip || !targetModel) return null;

    const boneMap = buildBoneMap(targetModel);
    const fixed = clip.clone();
    const total = clip.tracks.length;
    let kept = 0;

    fixed.tracks = fixed.tracks
      .map((track) => {
        const lastDot = track.name.lastIndexOf('.');
        if (lastDot === -1) return null;

        const bonePart = track.name.slice(0, lastDot);
        const prop = track.name.slice(lastDot + 1);
        const matched = findClosestBoneName(bonePart, boneMap);
        if (!matched) return null;

        if (prop === 'position' && isRootLikeBone(matched)) {
          return null;
        }

        const cloned = track.clone();
        cloned.name = `${matched}.${prop}`;
        kept += 1;
        return cloned;
      })
      .filter(Boolean);

    if (kept < 4) {
      logFail(`Анимация "${clip.name || 'noname'}" почти пустая: ${kept}/${total}`);
      return null;
    }

    logOK(`Анимация "${clip.name || 'noname'}" привязана: ${kept}/${total}, dur=${fixed.duration.toFixed(2)}s`);
    return fixed;
  }

  function scoreClipForKind(clip, kind) {
    const name = String(clip.name || '').toLowerCase();
    const dur = clip.duration || 0;
    const tracks = clip.tracks ? clip.tracks.length : 0;

    let scoreValue = tracks * 0.04;

    if (kind === 'run') {
      if (name.includes('run')) scoreValue += 6;
      if (name.includes('jog')) scoreValue += 4;
      if (name.includes('walk')) scoreValue -= 2;
      scoreValue -= Math.abs(dur - 0.9) * 2.5;
    }

    if (kind === 'jump') {
      if (name.includes('jump')) scoreValue += 8;
      if (name.includes('up')) scoreValue += 1.5;
      if (name.includes('fall')) scoreValue -= 2;
      if (name.includes('dance') || name.includes('idle')) scoreValue -= 7;
      if (dur > 2.6) scoreValue -= 4;
      if (dur < 0.15) scoreValue -= 10;
      const positionTracks = clip.tracks.filter((t) => t.name.endsWith('.position')).length;
      scoreValue += positionTracks * 0.2;
    }

    if (kind === 'fall') {
      if (name.includes('fall')) scoreValue += 8;
      if (name.includes('land')) scoreValue += 2;
      if (name.includes('death')) scoreValue += 2.5;
      if (name.includes('jump')) scoreValue -= 1.5;
      if (name.includes('dance') || name.includes('idle')) scoreValue -= 7;
      if (dur > 3.8) scoreValue -= 3;
      if (dur < 0.12) scoreValue -= 10;
    }

    if (kind.startsWith('dance')) {
      if (name.includes('dance')) scoreValue += 8;
      scoreValue += Math.min(4, dur);
    }

    return scoreValue;
  }

  function pickBestClip(gltf, kind) {
    if (!gltf || !gltf.animations || gltf.animations.length === 0) return null;
    const clips = gltf.animations.slice();
    clips.sort((a, b) => scoreClipForKind(b, kind) - scoreClipForKind(a, kind));
    return clips[0] || null;
  }

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
        (error) => {
          logFail('Ошибка GLB: ' + url);
          reject({ url, error });
        }
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
        (error) => {
          logFail('Ошибка текстуры: ' + url);
          reject({ url, error });
        }
      );
    });
  }

  function createTextTexture(text, bg, fg) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    ctx.fillStyle = fg;
    ctx.font = 'bold 118px Impact, Arial Black, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 12;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 6);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = renderer?.capabilities?.getMaxAnisotropy?.() || 1;
    return tex;
  }

  function createSharedAssets() {
    shared.obstacleGeo = new THREE.BoxGeometry(1, 1, 1);
    shared.coneGeo = new THREE.ConeGeometry(0.34, 0.9, 10);
    shared.coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.14, 24);

    shared.sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x303030, roughness: 1, metalness: 0 });
    shared.curbMat = new THREE.MeshStandardMaterial({ color: 0x727272, roughness: 1, metalness: 0 });
    shared.poleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.85, metalness: 0.2 });
    shared.neonMat = new THREE.MeshStandardMaterial({ color: 0x73162d, emissive: 0xaa2244, roughness: 0.55 });
    shared.darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
    shared.glowMat = new THREE.MeshStandardMaterial({ color: 0x665500, emissive: 0xaa8800, roughness: 0.35 });
    shared.trashMat = new THREE.MeshStandardMaterial({ color: 0x1e2428, roughness: 0.92 });
    shared.glassMat = new THREE.MeshStandardMaterial({ color: 0x8fd4ff, emissive: 0x0c1b28, roughness: 0.18, metalness: 0.08 });
    shared.barrierMat = new THREE.MeshStandardMaterial({ color: 0xf3f3f3, emissive: 0x1a1a1a, roughness: 0.7 });
    shared.carBodyMat = new THREE.MeshStandardMaterial({ color: 0x3a0c18, roughness: 0.65, metalness: 0.25 });
    shared.lampLightMat = new THREE.MeshBasicMaterial({ color: 0xffdd9a, transparent: true, opacity: 0.9 });

    loadedTextures.billboards = [
      createTextTexture('МУРИНО', '#111111', '#ff2c63'),
      createTextTexture('БЕГИ ОТ ФОГА', '#1a1111', '#f2e85c'),
      createTextTexture('MEL LIVE', '#0d0d14', '#68f8ff'),
      createTextTexture('НЕ ОБОРАЧИВАЙСЯ', '#101010', '#f5f5f5'),
      createTextTexture('EXIT ?', '#120f16', '#b487ff')
    ];

    shared.signMats = loadedTextures.billboards.map((tex) => new THREE.MeshBasicMaterial({ map: tex, transparent: false }));
  }

  function extractAnim(gltf, kindLabel) {
    const picked = pickBestClip(gltf, kindLabel);
    if (!picked) {
      logFail('Нет клипа для: ' + kindLabel);
      return null;
    }
    logInfo(`Клип для ${kindLabel}: ${(picked.name || 'noname')} (${picked.duration.toFixed(2)}s)`);
    return fixAnimation(picked, playerModel);
  }

  async function preloadAssets() {
    try {
      if (!checkLibraries()) return;
      await checkAllFiles();

      logInfo('--- ЗАГРУЗКА АССЕТОВ ---');

      loadedTextures.fog = await loadTexture(assets.textures.fog);
      loadedTextures.roads = [];
      loadedTextures.buildings = [];

      for (const url of assets.textures.roads) loadedTextures.roads.push(await loadTexture(url));
      for (const url of assets.textures.buildings) loadedTextures.buildings.push(await loadTexture(url));

      loadedTextures.roads.forEach((tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 12);
      });

      loadedTextures.buildings.forEach((tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 5);
      });

      const playerGltf = await loadGLTF(assets.models.player);
      playerModel = playerGltf.scene;
      playerModel.scale.set(1, 1, 1);
      playerModel.position.set(0, 0, 0);
      mixer = new THREE.AnimationMixer(playerModel);

      const runGltf = await loadGLTF(assets.models.run);
      animations.run = extractAnim(runGltf, 'run');

      const jumpGltf = await loadGLTF(assets.models.jump);
      animations.jump = extractAnim(jumpGltf, 'jump');

      const fallGltf = await loadGLTF(assets.models.fall);
      animations.fall = extractAnim(fallGltf, 'fall');

      const dance1Gltf = await loadGLTF(assets.models.dance1);
      animations.dance1 = extractAnim(dance1Gltf, 'dance1');

      const dance2Gltf = await loadGLTF(assets.models.dance2);
      animations.dance2 = extractAnim(dance2Gltf, 'dance2');

      if (!animations.jump) logFail('jump.glb не привязался. Включу процедурный прыжок как запасной вариант.');
      if (!animations.fall) logFail('fall.glb не привязался. Включу процедурное падение как запасной вариант.');

      createSharedAssets();

      logOK('Все основные ассеты готовы');

      setTimeout(() => {
        if (debugPanel) debugPanel.style.display = 'none';
        setupWorld();
        startIntro();
      }, 500);
    } catch (e) {
      console.error(e);
      logFail('Критическая ошибка загрузки');
    }
  }

  function playAnim(name, fadeTime = 0.12, force = false) {
    const clip = animations[name];
    if (!clip || !mixer) return false;

    const next = mixer.clipAction(clip);
    if (!force && currentAction === next) return true;

    if (name === 'jump' || name === 'fall') {
      mixer.stopAllAction();
    } else if (currentAction && currentAction !== next) {
      currentAction.fadeOut(fadeTime);
    }

    next.reset();
    next.enabled = true;
    next.setEffectiveWeight(1);
    next.setEffectiveTimeScale(1);

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
    return true;
  }

  function safePlayMovementAnim(name, fadeTime = 0.1) {
    if (!playAnim(name, fadeTime, true)) {
      currentAction = null;
      return false;
    }
    return true;
  }

  function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101115);
    scene.fog = new THREE.Fog(0x101115, 16, 170);

    const width = root.clientWidth || window.innerWidth;
    const height = root.clientHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(72, width / height, 0.1, 2000);
    dummyCamera = new THREE.PerspectiveCamera(72, width / height, 0.1, 2000);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    const ambient = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambient);

    const moon = new THREE.DirectionalLight(0xbfd7ff, 0.65);
    moon.position.set(16, 30, 8);
    moon.castShadow = true;
    moon.shadow.mapSize.width = 2048;
    moon.shadow.mapSize.height = 2048;
    moon.shadow.camera.near = 0.5;
    moon.shadow.camera.far = 120;
    moon.shadow.camera.left = -28;
    moon.shadow.camera.right = 28;
    moon.shadow.camera.top = 28;
    moon.shadow.camera.bottom = -28;
    scene.add(moon);

    const pinkFill = new THREE.PointLight(0xff295d, 1.2, 85, 2.2);
    pinkFill.position.set(0, 7, -18);
    scene.add(pinkFill);

    const cyanFill = new THREE.PointLight(0x35d6ff, 0.8, 60, 2.2);
    cyanFill.position.set(0, 4, 12);
    scene.add(cyanFill);

    setupControls();
    window.addEventListener('resize', onWindowResize, false);
  }

  function createFogSystem() {
    fogGroup = new THREE.Group();
    fogGroup.position.set(0, 1.7, -54);

    const specs = [
      { w: 18, h: 10, y: 1.0, z: 0, opacity: 0.72 },
      { w: 26, h: 13, y: 2.2, z: -4, opacity: 0.52 },
      { w: 34, h: 16, y: 3.2, z: -9, opacity: 0.34 }
    ];

    specs.forEach((s, index) => {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(s.w, s.h),
        new THREE.MeshBasicMaterial({
          map: loadedTextures.fog,
          transparent: true,
          opacity: s.opacity,
          depthWrite: false,
          side: THREE.DoubleSide,
          color: index === 0 ? 0xffffff : 0xdde8ff
        })
      );
      plane.position.set(0, s.y, s.z);
      plane.renderOrder = 900 + index;
      plane.userData.baseY = s.y;
      plane.userData.baseZ = s.z;
      plane.userData.speed = 0.6 + index * 0.25;
      fogGroup.add(plane);
    });

    scene.add(fogGroup);
  }

  function createRoadSegment(index) {
    const seg = new THREE.Group();
    seg.position.z = -index * ROAD_LEN;

    const roadTex = loadedTextures.roads[index % loadedTextures.roads.length];
    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 1,
      metalness: 0,
      side: THREE.DoubleSide
    });

    const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LEN), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    road.frustumCulled = false;
    seg.add(road);
    seg.userData.road = road;

    const shoulderGeo = new THREE.PlaneGeometry(10, ROAD_LEN);
    const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 1, side: THREE.DoubleSide });

    const leftShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
    leftShoulder.rotation.x = -Math.PI / 2;
    leftShoulder.position.set(-(ROAD_WIDTH * 0.5 + 5), -0.004, 0);
    leftShoulder.receiveShadow = true;
    seg.add(leftShoulder);

    const rightShoulder = leftShoulder.clone();
    rightShoulder.position.x = ROAD_WIDTH * 0.5 + 5;
    seg.add(rightShoulder);

    const sidewalkGeo = new THREE.BoxGeometry(4.6, 0.44, ROAD_LEN);
    const leftWalk = new THREE.Mesh(sidewalkGeo, shared.sidewalkMat);
    leftWalk.position.set(-(ROAD_WIDTH * 0.5 + 8.6), 0.18, 0);
    leftWalk.receiveShadow = true;
    seg.add(leftWalk);

    const rightWalk = leftWalk.clone();
    rightWalk.position.x = ROAD_WIDTH * 0.5 + 8.6;
    seg.add(rightWalk);

    const curbGeo = new THREE.BoxGeometry(0.28, 0.32, ROAD_LEN);
    const curbL = new THREE.Mesh(curbGeo, shared.curbMat);
    curbL.position.set(-(ROAD_WIDTH * 0.5 + 6.14), 0.13, 0);
    seg.add(curbL);

    const curbR = curbL.clone();
    curbR.position.x = ROAD_WIDTH * 0.5 + 6.14;
    seg.add(curbR);

    for (let laneX = -1.6; laneX <= 1.6; laneX += 3.2) {
      for (let z = -ROAD_LEN * 0.5 + 9; z < ROAD_LEN * 0.5; z += 12) {
        const stripe = new THREE.Mesh(
          new THREE.PlaneGeometry(0.18, 5.5),
          new THREE.MeshStandardMaterial({ color: 0xf0f0f0, emissive: 0x141414, roughness: 0.8, side: THREE.DoubleSide })
        );
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(laneX, 0.01, z);
        stripe.frustumCulled = false;
        seg.add(stripe);
      }
    }

    const decorGroup = new THREE.Group();
    seg.add(decorGroup);
    seg.userData.decor = decorGroup;

    decorateSegment(seg);
    scene.add(seg);
    return seg;
  }

  function clearGroup(group) {
    if (!group) return;
    while (group.children.length) group.remove(group.children[0]);
  }

  function makeBuilding(width, height, depth, tex, tint = 0xffffff) {
    const mat = new THREE.MeshStandardMaterial({ map: tex, color: tint, roughness: 1, metalness: 0.02 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.y = height * 0.5;
    return mesh;
  }

  function makeStreetLamp(side, z) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 5.6, 10), shared.poleMat);
    pole.position.y = 2.8;
    pole.castShadow = true;
    g.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.08), shared.poleMat);
    arm.position.set(side * 0.45, 5.35, 0);
    g.add(arm);

    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), shared.lampLightMat);
    lamp.position.set(side * 0.9, 5.18, 0);
    g.add(lamp);

    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(1.45, 1.45),
      new THREE.MeshBasicMaterial({ color: 0xfff0c2, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide })
    );
    halo.position.set(side * 0.88, 4.65, 0);
    g.add(halo);

    g.position.set(side * (ROAD_WIDTH * 0.5 + 6.9), 0, z);
    return g;
  }

  function makeBillboard(side, z) {
    const g = new THREE.Group();
    const poleL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.2, 0.18), shared.poleMat);
    const poleR = poleL.clone();
    poleL.position.set(-1.55, 2.6, 0);
    poleR.position.set(1.55, 2.6, 0);
    g.add(poleL, poleR);

    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 1.45),
      shared.signMats[Math.floor(Math.random() * shared.signMats.length)]
    );
    board.position.set(0, 4.8, 0);
    board.rotation.y = side === 1 ? -0.16 : 0.16;
    g.add(board);

    g.position.set(side * (ROAD_WIDTH * 0.5 + 10.8), 0, z);
    return g;
  }

  function makeDumpster(side, z) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.45, 1.2), shared.trashMat);
    body.position.y = 0.72;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.16, 1.26), shared.darkMat);
    lid.position.set(0, 1.48, 0);
    g.add(lid);

    g.position.set(side * (ROAD_WIDTH * 0.5 + 6.9), 0, z);
    return g;
  }

  function makeParkedCar(side, z) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.95, 4.7), shared.carBodyMat);
    body.position.y = 0.62;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.7, 2.25), shared.glassMat);
    cabin.position.set(0, 1.17, -0.15);
    g.add(cabin);

    const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.3, 14);
    const wheelMat = shared.darkMat;
    const wheelPositions = [
      [-0.98, 0.34, 1.45],
      [0.98, 0.34, 1.45],
      [-0.98, 0.34, -1.45],
      [0.98, 0.34, -1.45]
    ];

    wheelPositions.forEach((p) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI * 0.5;
      wheel.position.set(p[0], p[1], p[2]);
      g.add(wheel);
    });

    g.rotation.y = side === 1 ? Math.PI : 0;
    g.position.set(side * (ROAD_WIDTH * 0.5 + 11.1), 0, z);
    return g;
  }

  function decorateSegment(seg) {
    const decor = seg.userData.decor;
    clearGroup(decor);

    const leftLot = new THREE.Mesh(new THREE.PlaneGeometry(42, ROAD_LEN), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1, side: THREE.DoubleSide }));
    leftLot.rotation.x = -Math.PI / 2;
    leftLot.position.set(-(ROAD_WIDTH * 0.5 + 24), -0.01, 0);
    leftLot.receiveShadow = true;
    decor.add(leftLot);

    const rightLot = leftLot.clone();
    rightLot.position.x = ROAD_WIDTH * 0.5 + 24;
    decor.add(rightLot);

    const buildingCount = 4 + Math.floor(Math.random() * 4);
    for (let side of [-1, 1]) {
      for (let i = 0; i < buildingCount; i++) {
        const w = 5 + Math.random() * 5;
        const h = 12 + Math.random() * 34;
        const d = 6 + Math.random() * 10;
        const tex = loadedTextures.buildings[Math.floor(Math.random() * loadedTextures.buildings.length)];
        const tint = new THREE.Color().setHSL(0.6 + Math.random() * 0.08, 0.08, 0.35 + Math.random() * 0.08);
        const building = makeBuilding(w, h, d, tex, tint);
        building.position.x = side * (ROAD_WIDTH * 0.5 + 13 + Math.random() * 18);
        building.position.z = -ROAD_LEN * 0.5 + 12 + i * (ROAD_LEN / buildingCount) + (Math.random() * 10 - 5);
        decor.add(building);
      }

      const lampCount = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < lampCount; i++) {
        decor.add(makeStreetLamp(side, -ROAD_LEN * 0.5 + 18 + i * 40 + Math.random() * 10));
      }

      if (Math.random() > 0.35) decor.add(makeBillboard(side, -ROAD_LEN * 0.5 + 34 + Math.random() * 70));
      if (Math.random() > 0.45) decor.add(makeDumpster(side, -ROAD_LEN * 0.5 + 16 + Math.random() * 95));
      if (Math.random() > 0.25) decor.add(makeParkedCar(side, -ROAD_LEN * 0.5 + 18 + Math.random() * 88));
    }
  }

  function makeBackdrop() {
    farBackdrop = new THREE.Group();

    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(900, 220),
      new THREE.MeshBasicMaterial({ color: 0x06070a })
    );
    wall.position.set(0, 88, -1850);
    farBackdrop.add(wall);

    for (let i = 0; i < 110; i++) {
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(10 + Math.random() * 18, 40 + Math.random() * 110, 8 + Math.random() * 10),
        new THREE.MeshStandardMaterial({ color: 0x101318, emissive: 0x05070a, roughness: 1 })
      );
      tower.position.set(-280 + i * 5.1, tower.geometry.parameters.height * 0.5, -1750 - Math.random() * 140);
      farBackdrop.add(tower);
    }

    scene.add(farBackdrop);
  }

  function setupWorld() {
    playerGroup = new THREE.Group();
    playerGroup.position.set(targetX, PLAYER_Y_OFFSET, 0);
    playerGroup.rotation.y = Math.PI;
    playerGroup.add(playerModel);
    scene.add(playerGroup);

    worldGround = new THREE.Mesh(
      new THREE.PlaneGeometry(1200, 9000),
      new THREE.MeshStandardMaterial({ color: 0x08090b, roughness: 1 })
    );
    worldGround.rotation.x = -Math.PI / 2;
    worldGround.position.set(0, -0.04, -2200);
    worldGround.receiveShadow = true;
    scene.add(worldGround);

    makeBackdrop();
    createFogSystem();

    trackSegments = [];
    for (let i = 0; i < ROAD_COUNT; i++) {
      trackSegments.push(createRoadSegment(i));
    }

    camera.position.set(0, 4, 7);
    camera.lookAt(playerGroup.position.x, 2.1, playerGroup.position.z - 10);
  }

  function startIntro() {
    gameState = STATE.INTRO;
    if (loadingText) loadingText.style.display = 'none';
    if (introText) introText.style.display = 'block';

    if (gameUI) gameUI.style.display = 'none';
    if (overlayGameOver) overlayGameOver.style.display = 'none';

    camera.position.set(-5.7, 3.2, 2.8);
    camera.lookAt(playerGroup.position.x, 2.1, playerGroup.position.z);

    const danceName = Math.random() > 0.5 ? 'dance1' : 'dance2';
    playAnim(danceName, 0.15, true);

    if (videoElement) {
      videoElement.style.display = 'block';
      videoElement.muted = true;
      videoElement.loop = true;
      videoElement.play().catch(() => {});
    }

    root.addEventListener('click', onIntroClick, { once: true });
  }

  function onIntroClick() {
    if (gameState !== STATE.INTRO) return;
    if (introText) introText.style.display = 'none';
    if (videoElement) {
      videoElement.pause();
      videoElement.style.display = 'none';
    }
    startRun();
  }

  function resetCountersUi() {
    if (scoreEl) scoreEl.innerText = 'SCORE: 0';
    if (cashEl) cashEl.innerText = 'CASH: 0';
  }

  function startRun() {
    gameState = STATE.PLAYING;
    deathStarted = false;
    deathTime = 0;
    deathFogSpawned = false;

    if (gameUI) gameUI.style.display = 'flex';
    if (overlayGameOver) overlayGameOver.style.display = 'none';

    playerGroup.rotation.y = Math.PI;
    playerGroup.position.set(targetX, PLAYER_Y_OFFSET, 0);
    playerGroup.rotation.z = 0;
    playerModel.rotation.set(0, 0, 0);

    camera.position.set(0, 4, 7);
    camera.lookAt(playerGroup.position.x, 2.1, playerGroup.position.z - 10);

    playAnim('run', 0.16, true);

    if (fogGroup) {
      fogGroup.position.set(0, 1.6, -54);
      fogGroup.visible = true;
    }
  }

  function moveLeft() {
    if (gameState !== STATE.PLAYING) return;
    if (currentLane > 0) {
      currentLane -= 1;
      targetX = lanes[currentLane];
    }
  }

  function moveRight() {
    if (gameState !== STATE.PLAYING) return;
    if (currentLane < lanes.length - 1) {
      currentLane += 1;
      targetX = lanes[currentLane];
    }
  }

  function jump() {
    if (gameState !== STATE.PLAYING || isJumping) return;
    isJumping = true;
    airState = 'jump';
    velocityY = JUMP_POWER;
    safePlayMovementAnim('jump', 0.06);
  }

  function handleKeyDown(e) {
    if (!running) return;

    if (gameState === STATE.INTRO && ['Space', 'Enter'].includes(e.code)) {
      e.preventDefault();
      onIntroClick();
      return;
    }

    if (['ArrowLeft', 'KeyA'].includes(e.code)) {
      e.preventDefault();
      moveLeft();
    }
    if (['ArrowRight', 'KeyD'].includes(e.code)) {
      e.preventDefault();
      moveRight();
    }
    if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
      e.preventDefault();
      jump();
    }
  }

  let touchStartX = 0;
  let touchStartY = 0;

  function handleTouchStart(e) {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }

  function handleTouchEnd(e) {
    if (!running || gameState !== STATE.PLAYING) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 28) dx > 0 ? moveRight() : moveLeft();
    } else if (dy < -28) {
      jump();
    }
  }

  function setupControls() {
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    root.addEventListener('touchstart', handleTouchStart, { passive: true });
    root.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  function addUiButtonHandlers() {
    const bind = (btn, onTap) => {
      if (!btn) return;
      btn.addEventListener('mousedown', (e) => { e.preventDefault(); onTap(); });
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); onTap(); }, { passive: false });
      btn.addEventListener('click', (e) => { e.preventDefault(); onTap(); });
    };

    bind(leftBtn, moveLeft);
    bind(rightBtn, moveRight);
    bind(jumpBtn, jump);
  }

  function makeCoin(laneX, z, y = 1.3) {
    const mesh = new THREE.Mesh(shared.coinGeo, shared.glowMat);
    mesh.rotation.z = Math.PI * 0.5;
    mesh.position.set(laneX, y, z);
    mesh.castShadow = true;
    mesh.userData.baseY = y;
    mesh.userData.phase = Math.random() * Math.PI * 2;
    scene.add(mesh);
    coins.push(mesh);
  }

  function makeObstacleMesh(kind) {
    const g = new THREE.Group();
    let hitX = 0.9;
    let hitZ = 0.9;
    let jumpClearY = 1.1;

    if (kind === 'block') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), shared.darkMat);
      body.position.y = 0.9;
      body.castShadow = true;
      body.receiveShadow = true;
      g.add(body);
      hitX = 0.85;
      hitZ = 0.85;
      jumpClearY = 1.2;
    }

    if (kind === 'barrier') {
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.15, 0.95), shared.barrierMat);
      base.position.y = 0.58;
      base.castShadow = true;
      base.receiveShadow = true;
      g.add(base);

      for (let i = -1; i <= 1; i++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.18, 0.18), shared.neonMat);
        stripe.position.set(i * 0.62, 0.58, 0.49);
        stripe.rotation.z = 0.55;
        g.add(stripe);
      }

      hitX = 1.0;
      hitZ = 0.55;
      jumpClearY = 1.4;
    }

    if (kind === 'dumpster') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.55, 1.45), shared.trashMat);
      body.position.y = 0.78;
      body.castShadow = true;
      body.receiveShadow = true;
      g.add(body);

      const lid = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.15, 1.5), shared.darkMat);
      lid.position.set(0, 1.56, 0);
      g.add(lid);

      hitX = 1.0;
      hitZ = 0.75;
      jumpClearY = 1.65;
    }

    if (kind === 'car') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.95, 3.75), shared.carBodyMat);
      body.position.y = 0.58;
      body.castShadow = true;
      body.receiveShadow = true;
      g.add(body);

      const top = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.7, 1.82), shared.glassMat);
      top.position.set(0, 1.1, -0.18);
      g.add(top);

      const wheelGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.22, 12);
      const wheelData = [
        [-0.92, 0.29, 1.18],
        [0.92, 0.29, 1.18],
        [-0.92, 0.29, -1.18],
        [0.92, 0.29, -1.18]
      ];
      wheelData.forEach((w) => {
        const wheel = new THREE.Mesh(wheelGeo, shared.darkMat);
        wheel.rotation.z = Math.PI * 0.5;
        wheel.position.set(w[0], w[1], w[2]);
        g.add(wheel);
      });

      hitX = 1.05;
      hitZ = 1.5;
      jumpClearY = 1.85;
    }

    if (kind === 'cones') {
      for (let i = -1; i <= 1; i++) {
        const cone = new THREE.Mesh(shared.coneGeo, shared.neonMat);
        cone.position.set(i * 0.55, 0.45, 0);
        cone.castShadow = true;
        cone.receiveShadow = true;
        g.add(cone);
      }
      hitX = 1.05;
      hitZ = 0.55;
      jumpClearY = 0.95;
    }

    g.userData.hitX = hitX;
    g.userData.hitZ = hitZ;
    g.userData.jumpClearY = jumpClearY;
    g.userData.kind = kind;
    return g;
  }

  function spawnObstacle(kind, laneIndex, z) {
    const obj = makeObstacleMesh(kind);
    obj.position.set(lanes[laneIndex], 0, z);
    scene.add(obj);
    obstacles.push(obj);
    return obj;
  }

  function spawnCoinLine(laneIndex, z, count = 5, step = 3.2, baseY = 1.35) {
    for (let i = 0; i < count; i++) {
      makeCoin(lanes[laneIndex], z - i * step, baseY + Math.sin(i * 0.6) * 0.15);
    }
  }

  function spawnCoinArc(laneIndex, z, count = 6, step = 2.8) {
    for (let i = 0; i < count; i++) {
      const peak = Math.sin((i / Math.max(1, count - 1)) * Math.PI);
      makeCoin(lanes[laneIndex], z - i * step, 1.2 + peak * 1.2);
    }
  }

  function spawnPattern(distance) {
    difficultyLevel = Math.min(10, Math.floor(distance / 180));
    const spawnZ = playerGroup.position.z - 110;
    const safeLane = Math.floor(Math.random() * 3);
    const otherLanes = [0, 1, 2].filter((lane) => lane !== safeLane);

    const earlyPatterns = ['single', 'singleCoin', 'doubleGap', 'cones'];
    const midPatterns = ['single', 'doubleGap', 'barrierCoin', 'carGap', 'arc'];
    const latePatterns = ['doubleGap', 'barrierCoin', 'carGap', 'tripleRhythm', 'arc'];

    let pool = earlyPatterns;
    if (difficultyLevel >= 3) pool = midPatterns;
    if (difficultyLevel >= 6) pool = latePatterns;

    const pattern = pool[Math.floor(Math.random() * pool.length)];

    if (pattern === 'single') {
      const lane = Math.floor(Math.random() * 3);
      const kinds = ['block', 'barrier', difficultyLevel >= 4 ? 'dumpster' : 'block'];
      spawnObstacle(kinds[Math.floor(Math.random() * kinds.length)], lane, spawnZ);
      spawnCoinLine((lane + 1 + Math.floor(Math.random() * 2)) % 3, spawnZ - 4, 4, 3.1);
    }

    if (pattern === 'singleCoin') {
      const lane = Math.floor(Math.random() * 3);
      spawnObstacle('block', lane, spawnZ);
      spawnCoinArc(lane, spawnZ - 10, 6, 2.7);
    }

    if (pattern === 'doubleGap') {
      spawnObstacle(difficultyLevel >= 5 ? 'barrier' : 'block', otherLanes[0], spawnZ);
      spawnObstacle(difficultyLevel >= 5 ? 'dumpster' : 'block', otherLanes[1], spawnZ);
      spawnCoinLine(safeLane, spawnZ - 5, 6, 2.8);
    }

    if (pattern === 'cones') {
      spawnObstacle('cones', otherLanes[0], spawnZ);
      spawnObstacle('cones', otherLanes[1], spawnZ - 8);
      spawnCoinArc(safeLane, spawnZ - 6, 5, 2.4);
    }

    if (pattern === 'barrierCoin') {
      spawnObstacle('barrier', otherLanes[0], spawnZ);
      spawnObstacle('barrier', otherLanes[1], spawnZ - 6);
      spawnCoinLine(safeLane, spawnZ - 5, 7, 2.6, 1.45);
    }

    if (pattern === 'carGap') {
      spawnObstacle('car', otherLanes[0], spawnZ);
      if (difficultyLevel >= 5) spawnObstacle('barrier', otherLanes[1], spawnZ - 10);
      spawnCoinArc(safeLane, spawnZ - 8, 7, 2.9);
    }

    if (pattern === 'tripleRhythm') {
      const lanesShuffle = [0, 1, 2].sort(() => Math.random() - 0.5);
      spawnObstacle('block', lanesShuffle[0], spawnZ);
      spawnObstacle('barrier', lanesShuffle[1], spawnZ - 11);
      spawnObstacle('dumpster', lanesShuffle[2], spawnZ - 22);
      spawnCoinLine(lanesShuffle[0], spawnZ - 15, 4, 2.6);
      spawnCoinLine(lanesShuffle[1], spawnZ - 26, 4, 2.6);
    }

    if (pattern === 'arc') {
      spawnObstacle('dumpster', otherLanes[0], spawnZ);
      spawnObstacle('car', otherLanes[1], spawnZ - 12);
      spawnCoinArc(safeLane, spawnZ - 4, 8, 2.5);
    }
  }

  function recycleSegments() {
    let furthestAheadZ = Infinity;
    trackSegments.forEach((seg) => {
      if (seg.position.z < furthestAheadZ) furthestAheadZ = seg.position.z;
    });

    for (const seg of trackSegments) {
      if (seg.position.z > playerGroup.position.z + ROAD_RECYCLE_BEHIND) {
        seg.position.z = furthestAheadZ - ROAD_LEN;
        furthestAheadZ = seg.position.z;
        decorateSegment(seg);

        if (loadedTextures.roads.length > 1) {
          const road = seg.userData.road;
          const tex = loadedTextures.roads[Math.floor(Math.random() * loadedTextures.roads.length)];
          road.material.map = tex;
          road.material.needsUpdate = true;
        }
      }
    }
  }

  function updateSpawnSystem() {
    const distance = -playerGroup.position.z;
    while (distance >= nextSpawnDistance) {
      spawnPattern(distance);
      const gap = Math.max(18, 28 - difficultyLevel * 1.1) + Math.random() * 10;
      nextSpawnDistance += gap;
    }
  }

  function updateCoins(delta, dt) {
    const time = performance.now() * 0.001;
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.rotation.y += 0.12 * dt;
      c.position.y = c.userData.baseY + Math.sin(time * 4 + c.userData.phase) * 0.18;

      const dx = Math.abs(c.position.x - playerGroup.position.x);
      const dz = Math.abs(c.position.z - playerGroup.position.z);
      const dy = Math.abs(c.position.y - (playerGroup.position.y + 1.0));

      if (dx < 1.0 && dz < 1.0 && dy < 1.8) {
        scene.remove(c);
        coins.splice(i, 1);
        coinsCollected += 1;
        if (cashEl) cashEl.innerText = 'CASH: ' + coinsCollected;
      } else if (c.position.z > playerGroup.position.z + 30) {
        scene.remove(c);
        coins.splice(i, 1);
      }
    }
  }

  function updateObstacles() {
    const playerHitX = 0.72;
    const playerHitZ = 0.72;

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obj = obstacles[i];
      const dx = Math.abs(obj.position.x - playerGroup.position.x);
      const dz = Math.abs(obj.position.z - playerGroup.position.z);

      if (dx < playerHitX + obj.userData.hitX && dz < playerHitZ + obj.userData.hitZ) {
        if (playerGroup.position.y < obj.userData.jumpClearY) {
          triggerDeath();
          return;
        }
      }

      if (obj.position.z > playerGroup.position.z + 35) {
        scene.remove(obj);
        obstacles.splice(i, 1);
      }
    }
  }

  function updateProceduralPose(dt) {
    if (!playerModel) return;

    const laneOffset = targetX - playerGroup.position.x;
    const desiredLeanZ = THREE.MathUtils.clamp(-laneOffset * 0.09, -0.24, 0.24);
    playerModel.rotation.z += (desiredLeanZ - playerModel.rotation.z) * Math.min(1, 0.12 * dt);

    let desiredPitch = 0;
    if (gameState === STATE.PLAYING && isJumping) {
      desiredPitch = airState === 'jump' ? -0.22 : 0.28;
    }
    if (gameState === STATE.DYING) {
      desiredPitch = 0.44;
      playerGroup.rotation.z += (0.12 - playerGroup.rotation.z) * Math.min(1, 0.08 * dt);
    } else {
      playerGroup.rotation.z += (0 - playerGroup.rotation.z) * Math.min(1, 0.1 * dt);
    }

    playerModel.rotation.x += (desiredPitch - playerModel.rotation.x) * Math.min(1, 0.15 * dt);
  }

  function updateAmbientFog(dt) {
    if (!fogGroup || gameState !== STATE.PLAYING) return;
    const t = performance.now() * 0.001;
    const desiredX = playerGroup.position.x * 0.2 + Math.sin(t * 0.55) * 1.1;
    const desiredY = 1.45 + Math.sin(t * 1.7) * 0.18;
    const desiredZ = playerGroup.position.z - 48 - Math.sin(t * 1.2) * 4.5;

    fogGroup.position.x += (desiredX - fogGroup.position.x) * Math.min(1, 0.035 * dt);
    fogGroup.position.y += (desiredY - fogGroup.position.y) * Math.min(1, 0.05 * dt);
    fogGroup.position.z += (desiredZ - fogGroup.position.z) * Math.min(1, 0.04 * dt);

    fogGroup.lookAt(camera.position.x, camera.position.y * 0.55, camera.position.z);

    fogGroup.children.forEach((plane, index) => {
      plane.position.y = plane.userData.baseY + Math.sin(t * plane.userData.speed + index) * 0.22;
      plane.position.x = Math.sin(t * (0.7 + index * 0.3)) * (0.3 + index * 0.18);
    });
  }

  function updatePlaying(delta) {
    const dt = Math.min(2.2, delta * 60);

    speed = Math.min(MAX_SPEED, speed + 0.00095 * dt + difficultyLevel * 0.00005 * dt);

    playerGroup.position.z -= speed * dt;
    playerGroup.position.x += (targetX - playerGroup.position.x) * Math.min(1, 0.17 * dt);

    if (isJumping) {
      playerGroup.position.y += velocityY * dt;
      velocityY += GRAVITY * dt;

      if (velocityY < 0 && airState !== 'fall') {
        airState = 'fall';
        safePlayMovementAnim('fall', 0.05);
      }

      if (playerGroup.position.y <= PLAYER_Y_OFFSET) {
        playerGroup.position.y = PLAYER_Y_OFFSET;
        velocityY = 0;
        isJumping = false;
        airState = 'ground';
        playAnim('run', 0.12, true);
      }
    }

    camera.position.x += (playerGroup.position.x - camera.position.x) * Math.min(1, 0.18 * dt);
    camera.position.y += (playerGroup.position.y + 4.05 - camera.position.y) * Math.min(1, 0.14 * dt);
    camera.position.z += (playerGroup.position.z + 7.1 - camera.position.z) * Math.min(1, 0.2 * dt);
    camera.lookAt(playerGroup.position.x, playerGroup.position.y + 2.0, playerGroup.position.z - 10.5);

    if (worldGround) worldGround.position.z = camera.position.z - 2200;
    if (farBackdrop) farBackdrop.position.z = camera.position.z + 40;

    recycleSegments();
    updateSpawnSystem();
    updateCoins(delta, dt);
    updateObstacles();
    updateAmbientFog(dt);
    updateProceduralPose(dt);

    score = Math.floor(-playerGroup.position.z);
    if (scoreEl) scoreEl.innerText = 'SCORE: ' + score;
  }

  function triggerDeath() {
    if (gameState !== STATE.PLAYING || deathStarted) return;

    deathStarted = true;
    gameState = STATE.DYING;
    deathTime = 0;
    deathFogSpawned = false;
    speed = 0;

    safePlayMovementAnim('fall', 0.05);

    try {
      api.addCoins(coinsCollected);
      api.setHighScore(score);
      api.onUiUpdate();
    } catch (e) {
      console.warn('API update failed', e);
    }
  }

  function showGameOver() {
    gameState = STATE.GAMEOVER;
    if (overlayGameOver) overlayGameOver.style.display = 'flex';
    if (goScoreEl) goScoreEl.innerText = String(score);
    if (goCoinsEl) goCoinsEl.innerText = '+' + String(coinsCollected);
  }

  function updateDying(delta) {
    const dt = Math.min(2.2, delta * 60);
    deathTime += delta;

    if (!deathFogSpawned && fogGroup) {
      fogGroup.position.set(playerGroup.position.x, 1.3, playerGroup.position.z - 58);
      deathFogSpawned = true;
    }

    playerGroup.position.x += (targetX - playerGroup.position.x) * Math.min(1, 0.12 * dt);
    playerGroup.position.y += (PLAYER_Y_OFFSET - playerGroup.position.y) * Math.min(1, 0.18 * dt);

    const fallCamX = playerGroup.position.x;
    const fallCamY = playerGroup.position.y + 2.15;
    const fallCamZ = playerGroup.position.z + 3.0;

    camera.position.x += (fallCamX - camera.position.x) * Math.min(1, 0.1 * dt);
    camera.position.y += (fallCamY - camera.position.y) * Math.min(1, 0.1 * dt);
    camera.position.z += (fallCamZ - camera.position.z) * Math.min(1, 0.12 * dt);

    if (fogGroup) {
      fogGroup.position.x += (playerGroup.position.x - fogGroup.position.x) * Math.min(1, 0.04 * dt);
      fogGroup.position.y += (1.25 - fogGroup.position.y) * Math.min(1, 0.06 * dt);
      fogGroup.position.z += (14 + deathTime * 22) * delta;
      fogGroup.lookAt(camera.position);
    }

    camera.lookAt(playerGroup.position.x, 1.3, playerGroup.position.z - 10);
    updateProceduralPose(dt);

    if (!fogGroup || deathTime > 3.1 || fogGroup.position.z >= camera.position.z - 0.3) {
      showGameOver();
    }
  }

  function resetWorldPositions() {
    for (let i = 0; i < trackSegments.length; i++) {
      trackSegments[i].position.z = -i * ROAD_LEN;
      decorateSegment(trackSegments[i]);
    }

    if (worldGround) worldGround.position.z = -2200;
    if (farBackdrop) farBackdrop.position.z = 0;
    if (fogGroup) fogGroup.position.set(0, 1.6, -54);
  }

  function resetGame() {
    speed = 0.34;
    score = 0;
    coinsCollected = 0;
    nextSpawnDistance = 26;
    difficultyLevel = 0;

    currentLane = 1;
    targetX = lanes[currentLane];

    velocityY = 0;
    isJumping = false;
    airState = 'ground';
    deathStarted = false;
    deathTime = 0;
    deathFogSpawned = false;

    obstacles.forEach((o) => scene.remove(o));
    coins.forEach((c) => scene.remove(c));
    obstacles = [];
    coins = [];

    resetWorldPositions();
    resetCountersUi();

    if (mixer) mixer.stopAllAction();
    currentAction = null;

    startRun();
  }

  function onWindowResize() {
    if (!camera || !renderer) return;
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

  function animate() {
    if (!running) return;
    animationId = requestAnimationFrame(animate);

    const delta = clock ? clock.getDelta() : 1 / 60;
    if (mixer) mixer.update(delta);

    if (gameState === STATE.INTRO) {
      const t = performance.now() * 0.001;
      camera.position.x = Math.sin(t * 0.8) * 5.4;
      camera.position.z = Math.cos(t * 0.7) * 4.2 + 2.4;
      camera.position.y = 3.0 + Math.sin(t * 1.1) * 0.25;
      camera.lookAt(playerGroup.position.x, 2.0, playerGroup.position.z);
      if (fogGroup) {
        fogGroup.position.set(0, 1.7 + Math.sin(t * 1.2) * 0.14, -42 + Math.sin(t) * 2.5);
        fogGroup.lookAt(camera.position);
      }
      updateProceduralPose(Math.min(2.2, delta * 60));
    } else if (gameState === STATE.PLAYING) {
      updatePlaying(delta);
    } else if (gameState === STATE.DYING) {
      updateDying(delta);
    }

    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  function buildUI() {
    root.style.position = 'relative';
    root.style.overflow = 'hidden';
    root.style.touchAction = 'none';
    root.style.userSelect = 'none';

    uiLayer = document.createElement('div');
    uiLayer.style.position = 'absolute';
    uiLayer.style.inset = '0';
    uiLayer.style.pointerEvents = 'none';
    uiLayer.style.zIndex = '10';
    uiLayer.style.fontFamily = 'Impact, Arial Black, sans-serif';
    root.appendChild(uiLayer);

    loadingText = document.createElement('div');
    loadingText.innerText = 'ЗАГРУЗКА МУРИНО...';
    loadingText.style.cssText = 'position:absolute; top:10%; left:50%; transform:translateX(-50%); color:#ff2b63; font-size:24px; text-shadow:2px 2px 0 #000; text-align:center; font-family:monospace; line-height:1.5; white-space:nowrap;';
    uiLayer.appendChild(loadingText);

    debugPanel = document.createElement('div');
    debugPanel.style.cssText = 'position:absolute; top:18%; left:2%; right:2%; bottom:2%; background:rgba(0,0,0,0.92); border:2px solid #444; overflow-y:auto; padding:12px; z-index:999; pointer-events:auto; font-family:monospace; font-size:13px;';
    uiLayer.appendChild(debugPanel);

    introText = document.createElement('div');
    introText.innerText = 'ТАПНИ, ЧТОБЫ БЕЖАТЬ';
    introText.style.cssText = 'position:absolute; bottom:19%; left:50%; transform:translateX(-50%); color:#00ffb2; font-size:42px; text-shadow:3px 3px 0 #000; display:none; animation:pulseGame 0.95s infinite alternate; cursor:pointer; pointer-events:auto; text-align:center; padding:0 12px;';
    uiLayer.appendChild(introText);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulseGame {
        from { transform: translateX(-50%) scale(1); }
        to { transform: translateX(-50%) scale(1.08); }
      }
      .murino-btn {
        min-width: 76px;
        height: 76px;
        border-radius: 22px;
        border: 2px solid rgba(255,255,255,0.22);
        background: linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.45));
        color: #fff;
        font-size: 28px;
        font-family: Impact, Arial Black, sans-serif;
        box-shadow: 0 10px 25px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18);
        backdrop-filter: blur(6px);
      }
      .murino-btn:active {
        transform: scale(0.96);
      }
      .murino-cta {
        border: none;
        border-radius: 16px;
        padding: 16px 34px;
        font-size: 24px;
        font-family: Impact, Arial Black, sans-serif;
        color: white;
        background: linear-gradient(180deg, #ff4677, #a20f32);
        box-shadow: 0 10px 30px rgba(0,0,0,0.45);
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);

    videoElement = document.createElement('video');
    videoElement.src = assets.video;
    videoElement.playsInline = true;
    videoElement.muted = true;
    videoElement.loop = true;
    videoElement.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:none; opacity:0.24; z-index:6; pointer-events:none; mix-blend-mode:screen;';
    root.appendChild(videoElement);

    gameUI = document.createElement('div');
    gameUI.style.cssText = 'position:absolute; top:16px; left:0; right:0; display:none; justify-content:center; gap:20px; z-index:12; text-shadow:2px 2px 0 #000;';

    scoreEl = document.createElement('div');
    scoreEl.style.cssText = 'color:#ffffff; font-size:24px; background:rgba(0,0,0,0.38); border:1px solid rgba(255,255,255,0.15); padding:10px 16px; border-radius:14px;';
    scoreEl.innerText = 'SCORE: 0';

    cashEl = document.createElement('div');
    cashEl.style.cssText = 'color:#00ff8a; font-size:24px; background:rgba(0,0,0,0.38); border:1px solid rgba(255,255,255,0.15); padding:10px 16px; border-radius:14px;';
    cashEl.innerText = 'CASH: 0';

    gameUI.appendChild(scoreEl);
    gameUI.appendChild(cashEl);
    uiLayer.appendChild(gameUI);

    const mobileControls = document.createElement('div');
    mobileControls.style.cssText = 'position:absolute; left:0; right:0; bottom:20px; display:flex; justify-content:space-between; align-items:flex-end; padding:0 18px; z-index:13; pointer-events:none;';

    const leftWrap = document.createElement('div');
    leftWrap.style.cssText = 'display:flex; gap:12px; pointer-events:auto;';
    const rightWrap = document.createElement('div');
    rightWrap.style.cssText = 'display:flex; gap:12px; pointer-events:auto;';

    leftBtn = document.createElement('button');
    leftBtn.className = 'murino-btn';
    leftBtn.textContent = '◀';

    jumpBtn = document.createElement('button');
    jumpBtn.className = 'murino-btn';
    jumpBtn.textContent = '▲';

    rightBtn = document.createElement('button');
    rightBtn.className = 'murino-btn';
    rightBtn.textContent = '▶';

    leftWrap.appendChild(leftBtn);
    rightWrap.appendChild(jumpBtn);
    rightWrap.appendChild(rightBtn);
    mobileControls.appendChild(leftWrap);
    mobileControls.appendChild(rightWrap);
    uiLayer.appendChild(mobileControls);

    overlayGameOver = document.createElement('div');
    overlayGameOver.style.cssText = 'position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,0.9), rgba(17,5,8,0.96)); z-index:20; display:none; flex-direction:column; align-items:center; justify-content:center; color:#fff; text-shadow:2px 2px 0 #000; pointer-events:auto; padding:20px; text-align:center;';

    const title = document.createElement('h1');
    title.style.cssText = 'font-size:44px; margin:0 0 12px 0; color:#ff2b63;';
    title.innerText = 'ФОГ ДОГНАЛ';

    const scoreWrap = document.createElement('h2');
    scoreWrap.style.cssText = 'margin:8px 0; font-size:28px;';
    scoreWrap.innerHTML = 'SCORE: <span id="goScore">0</span>';

    const coinWrap = document.createElement('h2');
    coinWrap.style.cssText = 'margin:0; font-size:28px; color:#00ff8a;';
    coinWrap.innerHTML = 'КЭШ: <span id="goCoins">0</span>';

    const sub = document.createElement('div');
    sub.style.cssText = 'margin-top:10px; opacity:0.82; font-size:18px; max-width:520px;';
    sub.innerText = 'Теперь мир уже не пустой: трасса, билборды, машины, мусорки, фонари, вариативные паттерны и нормальный туман-чейзер.';

    const restartBtn = document.createElement('button');
    restartBtn.className = 'murino-cta';
    restartBtn.style.marginTop = '28px';
    restartBtn.innerText = 'ЕЩЁ ЗАБЕГ';
    restartBtn.addEventListener('click', resetGame);

    overlayGameOver.appendChild(title);
    overlayGameOver.appendChild(scoreWrap);
    overlayGameOver.appendChild(coinWrap);
    overlayGameOver.appendChild(sub);
    overlayGameOver.appendChild(restartBtn);
    uiLayer.appendChild(overlayGameOver);

    goScoreEl = scoreWrap.querySelector('#goScore');
    goCoinsEl = coinWrap.querySelector('#goCoins');

    addUiButtonHandlers();
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

  function stop() {
    running = false;
    cancelAnimationFrame(animationId);

    window.removeEventListener('keydown', handleKeyDown);
    root.removeEventListener('touchstart', handleTouchStart);
    root.removeEventListener('touchend', handleTouchEnd);
    window.removeEventListener('resize', onWindowResize);
    root.removeEventListener('click', onIntroClick);

    if (videoElement) {
      videoElement.pause();
      videoElement.src = '';
    }

    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    }

    root.innerHTML = '';
  }

  return { start, stop };
}
