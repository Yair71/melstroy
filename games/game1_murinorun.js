export function createGame(root, api) {
  let running = false;
  let animationId;

  // Three.js Core
  let scene, camera, renderer, player;
  
  // Game State
  let speed = 0.3;
  let score = 0;
  let coinsCollected = 0;
  
  // Lane System (3 полосы)
  const lanes = [-3, 0, 3]; // X координаты полос
  let currentLane = 1;      // Начинаем по центру (индекс 1)
  let targetX = 0;
  
  // Physics (Jump)
  let velocityY = 0;
  const gravity = -0.015;
  const jumpPower = 0.3;
  let isJumping = false;

  // World objects
  let buildings = [];
  let obstacles = [];
  let coins = [];
  let spawnTimer = 0;

  // Reusable Materials & Geometries (для оптимизации)
  let obstacleGeo, obstacleMat;
  let coinGeo, coinMat;

  // UI Elements
  let uiScore, uiCoins, overlay;

  function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333); 
    scene.fog = new THREE.Fog(0x333333, 10, 60);

    const width = root.clientWidth || 400;
    const height = root.clientHeight || 400;
    camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    root.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, -10);
    scene.add(dirLight);

    // Дорога
    const roadGeo = new THREE.PlaneGeometry(12, 2000);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    scene.add(road);

    // Сетка
    const gridHelper = new THREE.GridHelper(2000, 200, 0x00FF41, 0x000000);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Игрок (Меллстрой)
    const playerGeo = new THREE.BoxGeometry(1.2, 2, 1.2);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0xff003c });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 1;
    scene.add(player);

    // Инициализация ресурсов для препятствий и монет
    obstacleGeo = new THREE.BoxGeometry(2, 2, 2);
    obstacleMat = new THREE.MeshStandardMaterial({ color: 0x111111 }); // Темные блоки
    
    coinGeo = new THREE.OctahedronGeometry(0.6);
    coinMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xaa8800 }); // Золото

    // Спавн зданий по краям
    const bGeo = new THREE.BoxGeometry(4, 20, 4);
    const bMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    for (let i = 0; i < 30; i++) {
      const b = new THREE.Mesh(bGeo, bMat);
      b.position.z = - (Math.random() * 150);
      b.position.x = Math.random() > 0.5 ? 9 : -9;
      b.position.y = 10;
      scene.add(b);
      buildings.push(b);
    }

    setupControls();
    window.addEventListener('resize', onWindowResize, false);
  }

  // --- УПРАВЛЕНИЕ ---
  let touchStartX = 0;
  let touchStartY = 0;

  function moveLeft() {
    if (currentLane > 0) {
      currentLane--;
      targetX = lanes[currentLane];
    }
  }

  function moveRight() {
    if (currentLane < 2) {
      currentLane++;
      targetX = lanes[currentLane];
    }
  }

  function jump() {
    if (!isJumping) {
      isJumping = true;
      velocityY = jumpPower;
    }
  }

  function handleKeyDown(e) {
    if (!running) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') moveLeft();
    if (e.key === 'ArrowRight' || e.key === 'd') moveRight();
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') jump();
  }

  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchEnd(e) {
    if (!running) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Свайп по горизонтали
      if (Math.abs(dx) > 30) { // порог свайпа
        if (dx > 0) moveRight();
        else moveLeft();
      }
    } else {
      // Свайп по вертикали
      if (dy < -30) jump(); // Свайп вверх
    }
  }

  function setupControls() {
    window.addEventListener('keydown', handleKeyDown);
    root.addEventListener('touchstart', handleTouchStart);
    root.addEventListener('touchend', handleTouchEnd);
  }

  function removeControls() {
    window.removeEventListener('keydown', handleKeyDown);
    root.removeEventListener('touchstart', handleTouchStart);
    root.removeEventListener('touchend', handleTouchEnd);
  }

  // --- ГЕНЕРАЦИЯ ОБЪЕКТОВ ---
  function spawnRow() {
    // Выбираем случайную полосу для препятствия
    const obsLane = Math.floor(Math.random() * 3);
    
    const obs = new THREE.Mesh(obstacleGeo, obstacleMat);
    obs.position.set(lanes[obsLane], 1, player.position.z - 60);
    scene.add(obs);
    obstacles.push(obs);

    // Монетки спавним в других полосах
    const coinLane = Math.floor(Math.random() * 3);
    if (coinLane !== obsLane) {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.position.set(lanes[coinLane], 1, player.position.z - 60);
      scene.add(coin);
      coins.push(coin);
    }
  }

  // --- ИГРОВОЙ ЦИКЛ ---
  function animate() {
    if (!running) return;
    animationId = requestAnimationFrame(animate);

    // Постепенное увеличение скорости
    speed += 0.0001; 

    // Движение вперед
    player.position.z -= speed;
    
    // Плавное перестроение между полосами (Lerp)
    player.position.x += (targetX - player.position.x) * 0.15;

    // Гравитация и прыжок
    if (isJumping) {
      player.position.y += velocityY;
      velocityY += gravity;
      if (player.position.y <= 1) { // Упал на землю
        player.position.y = 1;
        isJumping = false;
        velocityY = 0;
      }
    }

    // Камера следует за игроком
    camera.position.z = player.position.z + 7;
    camera.position.x = player.position.x * 0.5; // Легкий сдвиг камеры
    camera.position.y = player.position.y + 3;
    camera.lookAt(player.position.x, 1, player.position.z - 10);

    // Спавн новых препятствий
    spawnTimer++;
    if (spawnTimer > 40 / speed) {
      spawnRow();
      spawnTimer = 0;
    }

    // Вращение монеток
    coins.forEach(c => c.rotation.y += 0.05);

    // --- ПРОВЕРКА КОЛЛИЗИЙ ---
    const hitDistance = 1.2;

    // Сбор монет
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      if (Math.abs(c.position.z - player.position.z) < hitDistance &&
          Math.abs(c.position.x - player.position.x) < hitDistance &&
          player.position.y < 2.5) { // Нельзя собрать монету, если перепрыгнул слишком высоко
        scene.remove(c);
        coins.splice(i, 1);
        coinsCollected += 10;
        uiCoins.innerText = 'CASH: ' + coinsCollected;
      }
      // Удаление пропущенных монет
      else if (c.position.z > camera.position.z) {
        scene.remove(c);
        coins.splice(i, 1);
      }
    }

    // Врезание в препятствия
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      if (Math.abs(obs.position.z - player.position.z) < hitDistance &&
          Math.abs(obs.position.x - player.position.x) < hitDistance &&
          player.position.y < 2) { 
        // ВРЕЗАЛИСЬ!
        gameOver();
        return;
      }
      // Удаление пройденных
      else if (obs.position.z > camera.position.z) {
        scene.remove(obs);
        obstacles.splice(i, 1);
      }
    }

    // Бесконечный город
    buildings.forEach(b => {
      if (b.position.z > camera.position.z + 10) {
        b.position.z -= 150;
      }
    });

    // Очки (Пройденная дистанция)
    score = Math.floor(Math.abs(player.position.z));
    uiScore.innerText = 'SCORE: ' + score;

    renderer.render(scene, camera);
  }

  function gameOver() {
    running = false;
    
    // Сохраняем прогресс в основной профиль
    api.addCoins(coinsCollected);
    api.setHighScore(score);
    
    // Показываем экран смерти
    overlay.style.display = 'flex';
    document.getElementById('goScore').innerText = score;
    document.getElementById('goCoins').innerText = '+' + coinsCollected;
  }

  function onWindowResize() {
    if (!camera || !renderer || !root) return;
    const width = root.clientWidth;
    const height = root.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function startRun() {
    if (running) return;
    running = true;
    root.innerHTML = '';
    
    // Создаем UI (Очки и Монеты)
    const uiContainer = document.createElement('div');
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '10px';
    uiContainer.style.left = '10px';
    uiContainer.style.pointerEvents = 'none'; // Чтобы не мешать свайпам
    root.appendChild(uiContainer);

    uiScore = document.createElement('div');
    uiScore.style.color = '#fff';
    uiScore.style.fontFamily = 'Impact';
    uiScore.style.fontSize = '20px';
    uiScore.style.textShadow = '2px 2px 0 #000';
    uiScore.innerText = 'SCORE: 0';
    uiContainer.appendChild(uiScore);

    uiCoins = document.createElement('div');
    uiCoins.style.color = '#00FF41';
    uiCoins.style.fontFamily = 'Impact';
    uiCoins.style.fontSize = '20px';
    uiCoins.style.textShadow = '2px 2px 0 #000';
    uiCoins.innerText = 'CASH: 0';
    uiContainer.appendChild(uiCoins);

    // Экран смерти (Game Over Overlay)
    overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.backgroundColor = 'rgba(255, 0, 60, 0.4)'; // Красный флеш
    overlay.style.backdropFilter = 'blur(4px)';
    overlay.style.display = 'none';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.color = '#fff';
    overlay.style.fontFamily = 'Impact';
    overlay.innerHTML = `
      <h1 style="font-size: 40px; margin: 0; text-shadow: 2px 2px 0 #000;">ФОГ ПОЙМАЛ ТЕБЯ!</h1>
      <h2 style="margin: 10px 0;">SCORE: <span id="goScore">0</span></h2>
      <h2 style="color: #00FF41; margin: 0;">КЭШ: <span id="goCoins">0</span></h2>
      <p style="font-family: sans-serif; font-size: 14px; margin-top: 20px;">Нажми Restart сверху</p>
    `;
    root.appendChild(overlay);
    root.style.position = 'relative';

    init3D();
    animate();
  }

  return {
    start() {
      startRun();
    },
    stop() {
      running = false;
      cancelAnimationFrame(animationId);
      removeControls();
      window.removeEventListener('resize', onWindowResize);
      root.innerHTML = "";
    }
  };
}
