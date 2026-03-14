import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { loadedAssets } from './assets.js';

let sceneRef;
const roadSegments = [];
const buildings = [];

export function initWorld(scene) {
  sceneRef = scene;

  // Жуткий, темный туман
  scene.fog = new THREE.FogExp2(0x05050a, 0.025); 
  scene.background = new THREE.Color(0x05050a);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0x5555aa, 1.5);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true; // Тень Мелстроя остается
  scene.add(dirLight);

  // Добавляем землю, чтобы здания не стояли в пустоте
  const groundGeo = new THREE.PlaneGeometry(300, 300);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 1 });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = -0.1; // Чуть ниже дороги
  scene.add(groundMesh);

  for (let i = 0; i < CONFIG.roadCount; i++) {
    createRoadSegment(i * (-CONFIG.roadLen / CONFIG.roadCount));
  }

  for (let i = 0; i < 40; i++) {
    spawnBuilding(Math.random() * -200);
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
  const mat = new THREE.MeshStandardMaterial({ map: tex, color: 0x444455 });
  const mesh = new THREE.Mesh(geo, mat);

  // Расширяем мир: здания стоят дальше друг от друга и рандомно
  const side = Math.random() > 0.5 ? 1 : -1;
  mesh.position.x = side * (CONFIG.roadWidth / 2 + width / 2 + 1 + Math.random() * 6);
  mesh.position.y = height / 2; 
  mesh.position.z = zPos;
  
  // УБРАЛИ ТЕНЬ ОТ ЗДАНИЙ
  mesh.castShadow = false; 
  mesh.receiveShadow = false;

  sceneRef.add(mesh);
  buildings.push(mesh);
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
}
