import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { loadedAssets } from './assets.js';

let sceneRef;
const roadSegments = [];
const buildings = [];
let particles; // Система насекомых/пыли

export function initWorld(scene) {
  sceneRef = scene;

  // Густой жуткий туман
  scene.fog = new THREE.FogExp2(0x0a0a14, 0.03); 
  scene.background = new THREE.Color(0x0a0a14);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0x7777cc, 1.5);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // МАССИВНАЯ ЗЕМЛЯ: Здания больше не висят в пустоте
  const groundGeo = new THREE.PlaneGeometry(1000, 1000);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 1 });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = -0.1; // Прямо под дорогой
  scene.add(groundMesh);

  // НАСЕКОМЫЕ / ПЫЛЬЦА В ВОЗДУХЕ
  const partGeo = new THREE.BufferGeometry();
  const partCount = 800;
  const posArr = new Float32Array(partCount * 3);
  for(let i = 0; i < partCount * 3; i += 3) {
      posArr[i] = (Math.random() - 0.5) * 80;     // X
      posArr[i+1] = Math.random() * 20;           // Y
      posArr[i+2] = (Math.random() - 0.5) * 80;   // Z
  }
  partGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  const partMat = new THREE.PointsMaterial({ size: 0.15, color: 0x88ffaa, transparent: true, opacity: 0.6 });
  particles = new THREE.Points(partGeo, partMat);
  scene.add(particles);

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
  const mat = new THREE.MeshStandardMaterial({ map: tex, color: 0x333344 });
  const mesh = new THREE.Mesh(geo, mat);

  const side = Math.random() > 0.5 ? 1 : -1;
  mesh.position.x = side * (CONFIG.roadWidth / 2 + width / 2 + 1 + Math.random() * 5);
  // Вкапываем здание в землю, чтобы не висело
  mesh.position.y = height / 2 - 0.1; 
  mesh.position.z = zPos;
  
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

  // Анимация насекомых (плавно летают)
  if (particles) {
      const positions = particles.geometry.attributes.position.array;
      for(let i = 1; i < positions.length; i += 3) {
          positions[i] -= 0.5 * deltaTime; // Медленно опускаются
          positions[i-1] += Math.sin(positions[i] * 5) * 0.05; // Виляют по X
          if (positions[i] < 0) positions[i] = 20; // Спавнятся сверху
      }
      particles.geometry.attributes.position.needsUpdate = true;
  }
}
