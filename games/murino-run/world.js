import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { loadedAssets } from './assets.js';

let sceneRef;
const roadSegments = [];
const buildings = [];

export function initWorld(scene) {
    sceneRef = scene;

    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.04); 
    scene.background = new THREE.Color(0x0a0a0a);

    const ambientLight = new THREE.AmbientLight(0x404040, 1.5); 
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x5555aa, 1.5); 
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    for (let i = 0; i < CONFIG.roadCount; i++) {
        createRoadSegment(i * (-CONFIG.roadLen / CONFIG.roadCount));
    }

    for (let i = 0; i < 20; i++) {
        spawnBuilding(Math.random() * -150);
    }
}

function createRoadSegment(zPos) {
    const textures = loadedAssets.textures.roads;
    const tex = textures[Math.floor(Math.random() * textures.length)];

    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 4);

    const geo = new THREE.PlaneGeometry(CONFIG.roadWidth, CONFIG.roadLen / CONFIG.roadCount);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);

    mesh.rotation.x = -Math.PI / 2; 
    mesh.position.z = zPos;

    sceneRef.add(mesh);
    roadSegments.push(mesh);
}

function spawnBuilding(zPos) {
    const textures = loadedAssets.textures.buildings;
    const tex = textures[Math.floor(Math.random() * textures.length)];

    const height = 15 + Math.random() * 25; 
    const width = 8 + Math.random() * 6;

    const geo = new THREE.BoxGeometry(width, height, width);
    const mat = new THREE.MeshStandardMaterial({ map: tex, color: 0x666666 });
    const mesh = new THREE.Mesh(geo, mat);

    const side = Math.random() > 0.5 ? 1 : -1;
    mesh.position.x = side * (CONFIG.roadWidth / 2 + width / 2 + Math.random() * 3);
    mesh.position.y = height / 2;
    mesh.position.z = zPos;

    sceneRef.add(mesh);
    buildings.push(mesh);
}

export function updateWorld(deltaTime) {
    if (gameState.current !== STATE.PLAYING) return;

    const moveSpeed = gameState.speed * 60 * deltaTime;

    // --- УДАЛЯЕМ ДОРОГУ ДАЛЕКО ЗА СПИНОЙ КАМЕРЫ (было > 10, стало > 40) ---
    roadSegments.forEach(road => {
        road.position.z += moveSpeed;
        if (road.position.z > 40) { 
            road.position.z -= CONFIG.roadLen;
        }
    });

    // --- ТАКЖЕ ПРЯЧЕМ ДОМА ДАЛЬШЕ ---
    buildings.forEach(b => {
        b.position.z += moveSpeed;
        if (b.position.z > 40) {
            b.position.z -= (150 + Math.random() * 50); 
        }
    });
}
