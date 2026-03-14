import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { loadedAssets } from './assets.js';

let sceneRef;
const roadSegments = [];
const buildings = [];
const fallingMeteors = [];

export function initWorld(scene) {
  sceneRef = scene;

  scene.fog = new THREE.FogExp2(0x1a1a2e, 0.02); // Немного ослабили туман для глубины
  scene.background = new THREE.Color(0x1a1a2e);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0x5555aa, 1.5);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  scene.add(dirLight);

  for (let i = 0; i < CONFIG.roadCount; i++) {
    createRoadSegment(i * (-CONFIG.roadLen / CONFIG.roadCount));
  }

  for (let i = 0; i < 30; i++) {
    spawnBuilding(Math.random() * -200);
  }
  
  // Спавн падающих метеоритов/обломков для живости мира
  for (let i = 0; i < 5; i++) {
      spawnMeteor();
  }
}

function createRoadSegment(zPos) {
  const textures = loadedAssets.textures.roads;
  const tex = textures[Math.floor(Math.random() * textures.length)];
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 4);

  const geo = new THREE.PlaneGeometry(CONFIG.roadWidth, CONFIG.roadLen / CONFIG.roadCount);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.z = zPos;
  mesh.receiveShadow = true;

  sceneRef.add(mesh);
  roadSegments.push(mesh);
}

function spawnBuilding(zPos) {
  const textures = loadedAssets.textures.buildings;
  const tex = textures[Math.floor(Math.random() * textures.length)];

  const height = 20 + Math.random() * 30;
  const width = 8 + Math.random() * 8;

  const geo = new THREE.BoxGeometry(width, height, width);
  const mat = new THREE.MeshStandardMaterial({ map: tex, color: 0x888888 });
  const mesh = new THREE.Mesh(geo, mat);

  const side = Math.random() > 0.5 ? 1 : -1;
  mesh.position.x = side * (CONFIG.roadWidth / 2 + width / 2 + 1);
  mesh.position.y = height / 2; // Теперь здание стоит ровно на земле, без отрыва
  mesh.position.z = zPos;
  mesh.castShadow = true;

  sceneRef.add(mesh);
  buildings.push(mesh);
}

function spawnMeteor() {
    const geo = new THREE.SphereGeometry(1, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
    const mesh = new THREE.Mesh(geo, mat);
    resetMeteor(mesh);
    sceneRef.add(mesh);
    fallingMeteors.push(mesh);
}

function resetMeteor(mesh) {
    const side = Math.random() > 0.5 ? 1 : -1;
    mesh.position.set(
        side * (20 + Math.random() * 30), 
        40 + Math.random() * 20, 
        gameState.current === STATE.PLAYING ? -100 - Math.random() * 100 : -50
    );
}

export function updateWorld(deltaTime) {
  if (gameState.current !== STATE.PLAYING) return;

  const moveSpeed = gameState.speed * 60 * deltaTime;

  roadSegments.forEach(road => {
    road.position.z += moveSpeed;
    if (road.position.z > 40) road.position.z -= CONFIG.roadLen;
  });

  buildings.forEach(b => {
    b.position.z += moveSpeed;
    if (b.position.z > 40) b.position.z -= (200 + Math.random() * 50);
  });
  
  fallingMeteors.forEach(m => {
      m.position.y -= 20 * deltaTime;
      m.position.z += moveSpeed;
      if (m.position.y < -5 || m.position.z > 20) resetMeteor(m);
  });
}
