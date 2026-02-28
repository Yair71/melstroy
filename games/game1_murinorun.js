export function createGame(root, api) {
  let running = false;
  let animationId;

  // Three.js variables
  let scene, camera, renderer, player;
  let speed = 0.15;

  function init3D() {
    // 1. Создаем сцену и добавляем серый "Муринский" туман
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x888888); 
    scene.fog = new THREE.Fog(0x888888, 10, 50); // Тот самый Fog!

    // 2. Настраиваем камеру (смотрим из-за спины)
    const width = root.clientWidth || 400;
    const height = root.clientHeight || 400;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 3, 5);
    camera.lookAt(0, 0, -10);

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

    // 5. Создаем дорогу (серый асфальт)
    const roadGeo = new THREE.PlaneGeometry(10, 1000);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    scene.add(road);

    // 6. Создаем игрока (пока красный кубик - это Меллстрой)
    const playerGeo = new THREE.BoxGeometry(1, 2, 1);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 1; // Поднимаем над дорогой
    scene.add(player);

    // Обработка ресайза окна
    window.addEventListener('resize', onWindowResize, false);
  }

  function onWindowResize() {
    if (!camera || !renderer) return;
    const width = root.clientWidth;
    const height = root.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function animate() {
    if (!running) return;
    animationId = requestAnimationFrame(animate);

    // Имитация движения вперед (двигаем камеру и игрока в минус по оси Z)
    player.position.z -= speed;
    camera.position.z -= speed;

    // Считаем дистанцию как очки (XP/Монеты)
    const score = Math.floor(Math.abs(player.position.z));
    
    // Рендерим кадр
    renderer.render(scene, camera);
  }

  function startRun() {
    if (running) return;
    running = true;
    root.innerHTML = ''; // Очищаем контейнер
    
    // UI поверх 3D канваса
    const ui = document.createElement('div');
    ui.style.position = 'absolute';
    ui.style.top = '10px';
    ui.style.left = '10px';
    ui.style.color = '#00FF41';
    ui.style.fontWeight = 'bold';
    ui.id = 'gameOverlay';
    root.appendChild(ui);
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
      window.removeEventListener('resize', onWindowResize);
      root.innerHTML = "";
    }
  };
}
