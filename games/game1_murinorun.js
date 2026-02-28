export function createGame(root, api) {
  let running = false;
  let animationId;

  // --- КОНФИГУРАЦИЯ ФАЙЛОВ (НАСТРОЙ ПОД СЕБЯ) ---
  const assets = {
    models: {
      player: './assets/Running.glb',      // Основная модель (и бег)
      jump: './assets/running Jump.glb',       // Прыжок
      fall: './assets/fall.glb',       // Падение при смерти
      dance1: './assets/dance.glb',   // Танец 1
      dance2: './assets/dance2.glb'    // Танец 2
    },
    textures: {
      fog: './assets/fog.jpg',         // Лицо Фога
      roads: [
        './assets/road1.jpg', 
        './assets/road2.jpg', 
        './assets/road3.jpg'
      ],
      buildings: [
        './assets/building1.jpg', 
        './assets/building2.jpg'
      ]
    },
    video: './assets/meme.webm'        // Видео-мем (webm или mp4)
  };

  // --- ЯДРО THREE.JS ---
  let scene, camera, renderer, dummyCamera;
  let clock;
  
  // --- ИГРОК И АНИМАЦИИ ---
  let playerGroup, playerModel, mixer;
  let animations = {}; // Хранилище загруженных анимаций
  let currentAction;

  // --- ОКРУЖЕНИЕ ---
  let fogEntity;
  let roadMeshes = [];
  let buildings = [];
  let obstacles = [];
  let coins = [];
  
  // Материалы и геометрии
  let loadedTextures = {};
  let obstacleGeo, obstacleMat;
  let coinGeo, coinMat;

  // --- ИГРОВЫЕ СОСТОЯНИЯ ---
  const STATE = { LOADING: 0, INTRO: 1, TRANSITION: 2, PLAYING: 3, DYING: 4 };
  let gameState = STATE.LOADING;

  // Переменные логики
  let speed = 0.3;
  let score = 0;
  let coinsCollected = 0;
  let deathTimer = 0; 
  let spawnTimer = 0;

  // Полосы
  const lanes = [-3, 0, 3];
  let currentLane = 1;
  let targetX = 0;

  // Прыжок
  let velocityY = 0;
  const gravity = -0.015;
  const jumpPower = 0.3;
  let isJumping = false;

  // UI
  let uiLayer, loadingText, introText, videoElement, gameUI, overlayGameOver;

  // --- 1. ЗАГРУЗЧИК АССЕТОВ ---
  function loadGLTF(url) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.GLTFLoader();
      loader.load(url, resolve, undefined, reject);
    });
  }

  function loadTexture(url) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(url, (tex) => {
        // Делаем текстуры четкими
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        resolve(tex);
      }, undefined, reject);
    });
  }

  async function preloadAssets() {
    try {
      // 1. Грузим текстуры
      loadedTextures.fog = await loadTexture(ASSETS.textures.fog);
      loadedTextures.roads = await Promise.all(ASSETS.textures.roads.map(url => loadTexture(url)));
      loadedTextures.buildings = await Promise.all(ASSETS.textures.buildings.map(url => loadTexture(url)));

      // Настраиваем повторение для дорог и зданий
      loadedTextures.roads.forEach(tex => { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, 10); });
      loadedTextures.buildings.forEach(tex => { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 5); });

      // 2. Грузим основную модель Меллстроя (в ней же лежит анимация бега)
      const playerGltf = await loadGLTF(ASSETS.models.player);
      playerModel = playerGltf.scene;
      
      // Настраиваем тени и размер модели
      playerModel.scale.set(1, 1, 1); // Подстрой масштаб, если он гигантский (например 0.01)
      playerModel.position.set(0, 0, 0);
      
      mixer = new THREE.AnimationMixer(playerModel);
      animations['run'] = playerGltf.animations[0];

      // 3. Грузим остальные анимации и вытаскиваем их
      const jumpGltf = await loadGLTF(ASSETS.models.jump);
      animations['jump'] = jumpGltf.animations[0];

      const fallGltf = await loadGLTF(ASSETS.models.fall);
      animations['fall'] = fallGltf.animations[0];

      const dance1Gltf = await loadGLTF(ASSETS.models.dance1);
      animations['dance1'] = dance1Gltf.animations[0];

      const dance2Gltf = await loadGLTF(ASSETS.models.dance2);
      animations['dance2'] = dance2Gltf.animations[0];

      // Запускаем интро
      setupWorld();
      startIntro();
    } catch (e) {
      console.error("Ошибка загрузки:", e);
      loadingText.innerText = "ОШИБКА ЗАГРУЗКИ. Проверь пути в ASSETS.";
    }
  }

  // Смена анимаций с плавным переходом
  function playAnim(name, fadeTime = 0.2) {
    if (!animations[name]) return;
    const action = mixer.clipAction(animations[name]);
    if (currentAction) currentAction.crossFadeTo(action, fadeTime, true);
    action.reset();
    action.play();
    currentAction = action;
  }

  // --- 2. ИНИЦИАЛИЗАЦИЯ МИРА ---
  function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    scene.fog = new THREE.Fog(0x222222, 10, 80);

    const width = root.clientWidth || 400;
    const height = root.clientHeight || 400;
    
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
    // 1. Игрок
    playerGroup = new THREE.Group();
    playerGroup.position.set(targetX, 0, 0);
    playerGroup.add(playerModel);
    scene.add(playerGroup);

    // 2. Дороги (Делаем 3 полотна друг за другом для бесконечности)
    for (let i = 0; i < 3; i++) {
      const tex = loadedTextures.roads[i % loadedTextures.roads.length];
      const roadGeo = new THREE.PlaneGeometry(12, 100);
      const roadMat = new THREE.MeshStandardMaterial({ map: tex });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.z = -i * 100;
      scene.add(road);
      roadMeshes.push(road);
    }

    // 3. ФОГ (Текстура натянута на плоскость)
    fogEntity = new THREE.Mesh(
      new THREE.PlaneGeometry(25, 25),
      new THREE.MeshBasicMaterial({ map: loadedTextures.fog, transparent: true })
    );
    // Изначально прячем его далеко
    fogEntity.position.set(0, 5, 50);
    scene.add(fogEntity);

    // 4. Здания
    const bGeo = new THREE.BoxGeometry(6, 40, 10);
    for (let i = 0; i < 20; i++) {
      // Рандомно выбираем текстуру здания
      const tex = loadedTextures.buildings[Math.floor(Math.random() * loadedTextures.buildings.length)];
      const bMat = new THREE.MeshStandardMaterial({ map: tex });
      const b = new THREE.Mesh(bGeo, bMat);
      
      b.position.z = - (Math.random() * 200);
      b.position.x = Math.random() > 0.5 ? 12 : -12;
      b.position.y = 20;
      scene.add(b);
      buildings.push(b);
    }

    // Ресурсы
    obstacleGeo = new THREE.BoxGeometry(2, 2, 2);
    obstacleMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    coinGeo = new THREE.OctahedronGeometry(0.6);
    coinMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xaa8800 });
  }

  // --- 3. ИГРОВЫЕ СОСТОЯНИЯ (СЦЕНАРИЙ) ---

  function startIntro() {
    gameState = STATE.INTRO;
    loadingText.style.display = 'none';
    introText.style.display = 'block';
    
    // Камера сбоку (Subway Surfers стиль)
    camera.position.set(-6, 3, 2);
    camera.lookAt(playerGroup.position.x, 2, playerGroup.position.z);

    // Выбираем рандомный танец
    const danceName = Math.random() > 0.5 ? 'dance1' : 'dance2';
    playAnim(danceName, 0.5);

    // Ждем клика по экрану
    root.addEventListener('click', onIntroClick, { once: true });
  }

  function onIntroClick() {
    if (gameState !== STATE.INTRO) return;
    gameState = STATE.TRANSITION;
    introText.style.display = 'none';
    
    // Включаем видео-мем!
    videoElement.style.display = 'block';
    videoElement.play().catch(e => console.log("Автоплей видео заблокирован", e));

    // Ждем 2 секунды (пока идет крик/мем) и начинаем бег
    setTimeout(() => {
      startRun();
    }, 2000);
  }

  function startRun() {
    gameState = STATE.PLAYING;
    videoElement.style.display = 'none';
    videoElement.pause();
    gameUI.style.display = 'flex';

    // Камера за спину
    camera.position.set(0, 4, 7);
    camera.lookAt(playerGroup.position.x, 2, -10);

    // Меллстрой разворачивается и бежит
    playerGroup.rotation.y = Math.PI; // Поворачиваем спиной к нам
    playAnim('run', 0.2);

    // Фог появляется
    fogEntity.position.set(0, 5, camera.position.z + 30);
  }

  // --- 4. УПРАВЛЕНИЕ ---
  function moveLeft() { if (currentLane > 0 && gameState === STATE.PLAYING) { currentLane--; targetX = lanes[currentLane]; } }
  function moveRight() { if (currentLane < 2 && gameState === STATE.PLAYING) { currentLane++; targetX = lanes[currentLane]; } }
  function jump() { 
    if (!isJumping && gameState === STATE.PLAYING) { 
      isJumping = true; velocityY = jumpPower; 
      playAnim('jump', 0.1); // Анимация прыжка
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

  // --- 5. ИГРОВОЙ ЦИКЛ ---
  function animate() {
    if (!running) return;
    animationId = requestAnimationFrame(animate);

    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    if (gameState === STATE.INTRO) {
      // Камера медленно облетает танцующего Мела
      camera.position.x = Math.sin(Date.now() * 0.001) * 6;
      camera.position.z = Math.cos(Date.now() * 0.001) * 6 + 2;
      camera.lookAt(playerGroup.position.x, 2, playerGroup.position.z);
    } 
    else if (gameState === STATE.PLAYING) {
      speed += 0.0001; 
      playerGroup.position.z -= speed;
      playerGroup.position.x += (targetX - playerGroup.position.x) * 0.15;

      // Физика прыжка
      if (isJumping) {
        playerGroup.position.y += velocityY;
        velocityY += gravity;
        if (playerGroup.position.y <= 0) { 
          playerGroup.position.y = 0; 
          isJumping = false; 
          velocityY = 0;
          playAnim('run', 0.2); // Приземлились - снова бежим
        }
      }

      camera.position.z = playerGroup.position.z + 7;
      camera.position.x = playerGroup.position.x * 0.5;
      camera.position.y = playerGroup.position.y + 4;
      camera.lookAt(playerGroup.position.x, 2, playerGroup.position.z - 10);

      // Бесконечная дорога
      roadMeshes.forEach(r => {
        if (r.position.z > camera.position.z + 10) r.position.z -= 300;
      });

      spawnTimer++;
      if (spawnTimer > 40 / speed) { spawnRow(); spawnTimer = 0; }

      coins.forEach(c => c.rotation.y += 0.05);

      // Коллизии
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
      
    } 
    else if (gameState === STATE.DYING) {
      deathTimer++;
      
      // Фог смотрит всегда на камеру (эффект 2D спрайта)
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

    renderer.render(scene, camera);
  }

  function triggerDeath() {
    gameState = STATE.DYING;
    deathTimer = 0; 
    playAnim('fall', 0.1); // Мел падает
    api.addCoins(coinsCollected);
    api.setHighScore(score);
    api.onUiUpdate(); 
  }

  function resetGame() {
    speed = 0.3; score = 0; coinsCollected = 0;
    currentLane = 1; targetX = lanes[currentLane];
    isJumping = false; velocityY = 0; deathTimer = 0;
    
    playerGroup.position.set(targetX, 0, 0);
    camera.position.set(0, 4, 7);
    camera.lookAt(playerGroup.position.x, 2, -10);
    
    obstacles.forEach(o => scene.remove(o)); obstacles = [];
    coins.forEach(c => scene.remove(c)); coins = [];
    buildings.forEach(b => b.position.z = - (Math.random() * 200));
    
    overlayGameOver.style.display = 'none';
    document.getElementById('sUi').innerText = 'SCORE: 0';
    document.getElementById('cUi').innerText = 'CASH: 0';
    
    startRun(); // Запускаем сразу бег, без интро
    running = true;
    animate();
  }

  function onWindowResize() {
    if (!camera || !renderer || !root) return;
    const width = root.clientWidth; const height = root.clientHeight;
    camera.aspect = width / height; camera.updateProjectionMatrix();
    if(dummyCamera) { dummyCamera.aspect = width / height; dummyCamera.updateProjectionMatrix(); }
    renderer.setSize(width, height);
  }

  // --- 6. СОЗДАНИЕ HTML ИНТЕРФЕЙСА ---
  function buildUI() {
    uiLayer = document.createElement('div');
    uiLayer.style.position = 'absolute';
    uiLayer.style.inset = '0';
    uiLayer.style.pointerEvents = 'none';
    uiLayer.style.zIndex = '10';
    uiLayer.style.fontFamily = 'Impact';
    root.appendChild(uiLayer);

    // Экран загрузки
    loadingText = document.createElement('div');
    loadingText.innerText = 'ЗАГРУЗКА ХАЙПА...';
    loadingText.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#FF003C; font-size:30px; text-shadow:2px 2px 0 #000;';
    uiLayer.appendChild(loadingText);

    // Текст Интро (Нажми чтобы начать)
    introText = document.createElement('div');
    introText.innerText = 'ТАПАЙ ПО ЭКРАНУ!';
    introText.style.cssText = 'position:absolute; bottom:20%; left:50%; transform:translateX(-50%); color:#00FF41; font-size:40px; text-shadow:3px 3px 0 #000; display:none; animation: pulse 1s infinite alternate;';
    uiLayer.appendChild(introText);
    
    // Анимация пульсации для текста
    const style = document.createElement('style');
    style.innerHTML = `@keyframes pulse { from { transform: translateX(-50%) scale(1); } to { transform: translateX(-50%) scale(1.1); } }`;
    document.head.appendChild(style);

    // Видео-Мем
    videoElement = document.createElement('video');
    videoElement.src = ASSETS.video;
    videoElement.playsInline = true;
    videoElement.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:none; z-index:15;';
    root.appendChild(videoElement);

    // Игровой UI (Счет и кэш)
    gameUI = document.createElement('div');
    gameUI.style.cssText = 'position:absolute; top:15px; width:100%; display:none; justify-content:center; gap:30px; z-index:12; text-shadow:2px 2px 0 #000;';
    gameUI.innerHTML = `<div id="sUi" style="color:#fff; font-size:24px;">SCORE: 0</div><div id="cUi" style="color:#00FF41; font-size:24px;">CASH: 0</div>`;
    uiLayer.appendChild(gameUI);

    // Экран Game Over
    overlayGameOver = document.createElement('div');
    overlayGameOver.style.cssText = 'position:absolute; inset:0; background:rgba(0,0,0,0.9); z-index:20; display:none; flex-direction:column; align-items:center; justify-content:center; color:#fff; text-shadow:2px 2px 0 #000; pointer-events:auto;';
    overlayGameOver.innerHTML = `
      <h1 style="font-size:40px; margin:0; color:#FF003C;">ФОГ СЪЕЛ!</h1>
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
    preloadAssets(); // Начинаем загрузку
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
