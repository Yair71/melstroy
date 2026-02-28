export function createGame(root, api) {
  let running = false;
  let animationId;

  // Three.js Core
  let scene, camera, renderer, player, dummyCamera;
  let road, gridHelper, fogEntity;

  // Game State
  let speed = 0.3;
  let score = 0;
  let coinsCollected = 0;
  let isDying = false; 
  let deathTimer = 0; // Добавили таймер для задержки смерти

  // Lane System
  const lanes = [-3, 0, 3];
  let currentLane = 1;
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

  // Reusable Materials
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
    
    // Основная камера
    camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    
    // Камера-помощник для просчета плавного поворота головы
    dummyCamera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    root.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, -10);
    scene.add(dirLight);

    // Дорога и сетка
    const roadGeo = new THREE.PlaneGeometry(12, 2000);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    scene.add(road);

    gridHelper = new THREE.GridHelper(2000, 200, 0x00FF41, 0x000000);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Игрок
    const playerGeo = new THREE.BoxGeometry(1.2, 2, 1.2);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0xff003c });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 1;
    scene.add(player);

    // ДЕЛАЕМ КРИПОВОГО ФОГА
    fogEntity = new THREE.Group();
    
    // Тело Фога
    const fogBody = new THREE.Mesh(
      new THREE.BoxGeometry(20, 20, 10), 
      new THREE.MeshBasicMaterial({ color: 0x050505 })
    );
    fogEntity.add(fogBody);
    
    // Красные глаза Фога
    const eyeGeo = new THREE.BoxGeometry(2, 2, 0.5);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Светящийся красный
    const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
    eyeLeft.position.set(-4, 5, -5.1); 
    fogEntity.add(eyeLeft);
    
    const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
    eyeRight.position.set(4, 5, -5.1);
    fogEntity.add(eyeRight);

    scene.add(fogEntity);

    // Ресурсы
    obstacleGeo = new THREE.BoxGeometry(2, 2, 2);
    obstacleMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    coinGeo = new THREE.OctahedronGeometry(0.6);
    coinMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xaa8800 });

    // Здания
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
  function moveLeft() {
    if (currentLane > 0 && !isDying) {
      currentLane--;
      targetX = lanes[currentLane];
    }
  }

  function moveRight() {
    if (currentLane < 2 && !isDying) {
      currentLane++;
      targetX = lanes[currentLane];
    }
  }

  function jump() {
    if (!isJumping && !isDying) {
      isJumping = true;
      velocityY = jumpPower;
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
    if (!running || isDying) return;
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

  function removeControls() {
    window.removeEventListener('keydown', handleKeyDown);
    root.removeEventListener('touchstart', handleTouchStart);
    root.removeEventListener('touchend', handleTouchEnd);
  }

  function spawnRow() {
    if(isDying) return;
    const obsLane = Math.floor(Math.random() * 3);
    const obs = new THREE.Mesh(obstacleGeo, obstacleMat);
    obs.position.set(lanes[obsLane], 1, player.position.z - 70);
    scene.add(obs);
    obstacles.push(obs);

    const coinLane = Math.floor(Math.random() * 3);
    if (coinLane !== obsLane) {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.position.set(lanes[coinLane], 1, player.position.z - 70);
      scene.add(coin);
      coins.push(coin);
    }
  }

  function animate() {
    if (!running) return;
    animationId = requestAnimationFrame(animate);

    if (!isDying) {
      // ОБЫЧНАЯ ИГРА
      speed += 0.0001; 
      player.position.z -= speed;
      player.position.x += (targetX - player.position.x) * 0.15;

      if (isJumping) {
        player.position.y += velocityY;
        velocityY += gravity;
        if (player.position.y <= 1) { 
          player.position.y = 1; isJumping = false; velocityY = 0;
        }
      }

      camera.position.z = player.position.z + 7;
      camera.position.x = player.position.x * 0.5;
      camera.position.y = player.position.y + 3;
      camera.lookAt(player.position.x, 1, player.position.z - 10); // Жестко смотрим вперед

      gridHelper.position.z = Math.floor(camera.position.z / 10) * 10;
      road.position.z = camera.position.z;

      spawnTimer++;
      if (spawnTimer > 40 / speed) { spawnRow(); spawnTimer = 0; }

      coins.forEach(c => c.rotation.y += 0.05);

      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        if (Math.abs(c.position.z - player.position.z) < 1.2 && Math.abs(c.position.x - player.position.x) < 1.2 && player.position.y < 2.5) {
          scene.remove(c); coins.splice(i, 1);
          coinsCollected += 1; 
          uiCoins.innerText = 'CASH: ' + coinsCollected;
        } else if (c.position.z > camera.position.z) { scene.remove(c); coins.splice(i, 1); }
      }

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (Math.abs(obs.position.z - player.position.z) < 1.2 && Math.abs(obs.position.x - player.position.x) < 1.2 && player.position.y < 2) {
          triggerDeath();
        } else if (obs.position.z > camera.position.z) { scene.remove(obs); obstacles.splice(i, 1); }
      }

      buildings.forEach(b => { if (b.position.z > camera.position.z + 10) b.position.z -= 150; });
      
      score = Math.floor(Math.abs(player.position.z));
      uiScore.innerText = 'SCORE: ' + score;
      
      // Фог держится далеко позади
      fogEntity.position.set(0, 5, camera.position.z + 30);
      
    } else {
      // ИГРОК ВРЕЗАЛСЯ! АНИМАЦИЯ ПЛАВНОГО ПОВОРОТА И СМЕРТИ
      deathTimer++;
      
      // 1. Нацеливаем невидимую камеру на Фога
      dummyCamera.position.copy(camera.position);
      dummyCamera.lookAt(fogEntity.position.x, fogEntity.position.y, fogEntity.position.z);
      
      // 2. Плавно поворачиваем РЕАЛЬНУЮ камеру к цели 
      // 0.1 - золотая середина (умеренно быстро, но плавно)
      camera.quaternion.slerp(dummyCamera.quaternion, 0.1);
      
      // 3. Ждем примерно 1.5 секунды (около 90 кадров)
      if (deathTimer < 90) {
         // Фог медленно надвигается на тебя во время и после поворота
         fogEntity.position.z -= speed * 0.8;
      } else {
         // 4. По истечению 1.5 сек Фог делает резкий бросок
         fogEntity.position.z -= speed * 8;
      }
      
      // 5. Как только Фог влетает нам в лицо - геймовер
      if (fogEntity.position.z < camera.position.z + 2) {
        running = false;
        showGameOverUI();
      }
    }

    renderer.render(scene, camera);
  }

  function triggerDeath() {
    isDying = true;
    deathTimer = 0; // Начинаем отсчет смерти
    api.addCoins(coinsCollected);
    api.setHighScore(score);
    api.onUiUpdate(); 
  }

  function showGameOverUI() {
    overlay.style.display = 'flex';
    document.getElementById('goScore').innerText = score;
    document.getElementById('goCoins').innerText = '+' + coinsCollected;
  }

  function resetGame() {
    speed = 0.3; score = 0; coinsCollected = 0;
    currentLane = 1; targetX = lanes[currentLane];
    isJumping = false; velocityY = 0; isDying = false; deathTimer = 0;
    
    // Сбрасываем позицию
    player.position.set(targetX, 1, 0);
    camera.position.set(0, 4, 7);
    
    // ВАЖНО: Сбрасываем поворот камеры, чтобы она снова смотрела вперед
    camera.lookAt(player.position.x, 1, -10);
    
    // Очищаем уровень
    obstacles.forEach(o => scene.remove(o)); obstacles = [];
    coins.forEach(c => scene.remove(c)); coins = [];
    buildings.forEach(b => b.position.z = - (Math.random() * 150));
    
    overlay.style.display = 'none';
    uiScore.innerText = 'SCORE: 0';
    uiCoins.innerText = 'CASH: 0';
    
    running = true;
    animate();
  }

  function onWindowResize() {
    if (!camera || !renderer || !root) return;
    const width = root.clientWidth;
    const height = root.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    if(dummyCamera) {
      dummyCamera.aspect = width / height;
      dummyCamera.updateProjectionMatrix();
    }
    
    renderer.setSize(width, height);
  }

  function startRun() {
    if (running) return;
    running = true;
    
    const uiContainer = document.createElement('div');
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '15px';
    uiContainer.style.left = '50%';
    uiContainer.style.transform = 'translateX(-50%)';
    uiContainer.style.pointerEvents = 'none';
    uiContainer.style.display = 'flex';
    uiContainer.style.gap = '20px';
    uiContainer.style.zIndex = '10';
    root.appendChild(uiContainer);

    uiScore = document.createElement('div');
    uiScore.style.color = '#fff';
    uiScore.style.fontFamily = 'Impact';
    uiScore.style.fontSize = '24px';
    uiScore.style.textShadow = '2px 2px 0 #000';
    uiScore.innerText = 'SCORE: 0';
    uiContainer.appendChild(uiScore);

    uiCoins = document.createElement('div');
    uiCoins.style.color = '#00FF41';
    uiCoins.style.fontFamily = 'Impact';
    uiCoins.style.fontSize = '24px';
    uiCoins.style.textShadow = '2px 2px 0 #000';
    uiCoins.innerText = 'CASH: 0';
    uiContainer.appendChild(uiCoins);

    overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'; 
    overlay.style.zIndex = '20';
    overlay.style.display = 'none';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.color = '#fff';
    overlay.style.fontFamily = 'Impact';
    overlay.innerHTML = `
      <h1 style="font-size: 40px; margin: 0; color: #FF003C;">ФОГ ПОЙМАЛ ТЕБЯ!</h1>
      <h2 style="margin: 10px 0;">SCORE: <span id="goScore">0</span></h2>
      <h2 style="color: #00FF41; margin: 0;">КЭШ: <span id="goCoins">0</span></h2>
      <button id="btnInGameRestart" class="btn" style="margin-top: 30px; width: 200px; font-size: 20px; pointer-events: auto;">ПОВТОРИТЬ</button>
    `;
    root.appendChild(overlay);

    overlay.querySelector('#btnInGameRestart').addEventListener('click', resetGame);

    init3D();
    animate();
  }

  return {
    start() { startRun(); },
    stop() {
      running = false;
      cancelAnimationFrame(animationId);
      removeControls();
      window.removeEventListener('resize', onWindowResize);
      root.innerHTML = "";
    }
  };
}
