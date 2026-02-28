export function createGame(root, api) {
  let running = false;
  let animationId;

  // Three.js variables
  let scene, camera, renderer, player;
  let speed = 0.2; // Чуть увеличим скорость для хайпа
  let buildings = [];

  function init3D() {
    // 1. Создаем сцену и серый "Муринский" туман
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x888888); 
    scene.fog = new THREE.Fog(0x888888, 10, 50);

    // 2. Настраиваем камеру
    const width = root.clientWidth || 400;
    const height = root.clientHeight || 400;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 3, 6); // Камера чуть выше и дальше

    // 3. Настраиваем рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    root.appendChild(renderer.domElement);

    // 4. Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // 5. Дорога (теперь с сеткой, чтобы видеть движение!)
    const roadGeo = new THREE.PlaneGeometry(10, 2000);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    scene.add(road);

    // Добавляем неоновую сетку поверх дороги (вайб хайпа)
    const gridHelper = new THREE.GridHelper(2000, 200, 0x00FF41, 0x000000);
    gridHelper.position.y = 0.01; // Чуть выше асфальта
    scene.add(gridHelper);

    // 6. Спавним серые панельки Мурино по бокам
    const bGeo = new THREE.BoxGeometry(3, 15, 3);
    const bMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    
    for (let i = 0; i < 40; i++) {
      const building = new THREE.Mesh(bGeo, bMat);
      // Раскидываем их далеко вперед
      building.position.z = - (Math.random() * 200);
      // Ставим либо слева, либо справа от дороги
      building.position.x = Math.random() > 0.5 ? 8 : -8;
      building.position.y = 7.5; // Половина высоты, чтобы стояли на земле
      scene.add(building);
      buildings.push(building);
    }

    // 7. Игрок (Кубик-Меллстрой)
    const playerGeo = new THREE.BoxGeometry(1.5, 2, 1.5);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0xff003c }); // Казино-красный
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 1;
    scene.add(player);

    window.addEventListener('resize', onWindowResize, false);
  }

  function onWindowResize() {
    if (!camera || !renderer || !root) return;
    const width = root.clientWidth;
    const height = root.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function animate() {
    if (!running) return;
    animationId = requestAnimationFrame(animate);

    // Двигаем игрока и камеру вперед
    player.position.z -= speed;
    
    // Камера жестко привязана за спиной кубика
    camera.position.z = player.position.z + 6;
    camera.position.x = player.position.x;
    camera.lookAt(player.position.x, player.position.y, player.position.z - 10);

    // Если панелька осталась далеко позади, переносим её вперед (эффект бесконечности)
    buildings.forEach(b => {
      if (b.position.z > camera.position.z + 10) {
        b.position.z -= 200; // Кидаем её обратно в туман
      }
    });

    renderer.render(scene, camera);
  }

  function startRun() {
    if (running) return;
    running = true;
    root.innerHTML = '';
    
    // UI для очков
    const ui = document.createElement('div');
    ui.style.position = 'absolute';
    ui.style.top = '15px';
    ui.style.left = '15px';
    ui.style.color = '#FFD700'; // Золотой
    ui.style.fontFamily = 'Impact, sans-serif';
    ui.style.fontSize = '24px';
    ui.style.textShadow = '2px 2px 0 #000';
    ui.id = 'gameScore';
    ui.innerText = 'SCORE: 0';
    root.appendChild(ui);
    root.style.position = 'relative';

    init3D();
    
    // Запускаем счетчик очков, чтобы UI обновлялся
    setInterval(() => {
      if(running) {
        const score = Math.floor(Math.abs(player.position.z));
        document.getElementById('gameScore').innerText = 'SCORE: ' + score;
      }
    }, 100);

    animate();
  }

  return {
    start() {
      startRun();
    },
    stop() {
      running = false;
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onWindowResize);
      root.innerHTML = "";
    }
  };
}
