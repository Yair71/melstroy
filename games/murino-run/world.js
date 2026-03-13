import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { loadedAssets } from './assets.js';

let sceneRef;
const roadSegments = [];
const buildings = [];

export function initWorld(scene) {
    sceneRef = scene;
    
    // 1. CREEPY MURINO ATMOSPHERE (Environment Fog)
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.04); // Dark thick fog
    scene.background = new THREE.Color(0x0a0a0a);

    // 2. LIGHTING (Cold, moody moonlight)
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Soft dark light
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0x5555aa, 1.5); // Blue-ish tint
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // 3. GENERATE ROADS
    for (let i = 0; i < CONFIG.roadCount; i++) {
        createRoadSegment(i * (-CONFIG.roadLen / CONFIG.roadCount));
    }
    
    // 4. GENERATE BUILDINGS (Scattered along the sides)
    for (let i = 0; i < 20; i++) {
        spawnBuilding(Math.random() * -150);
    }
}

function createRoadSegment(zPos) {
    const textures = loadedAssets.textures.roads;
    const tex = textures[Math.floor(Math.random() * textures.length)];
    
    // Make texture repeat properly
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 4);

    const geo = new THREE.PlaneGeometry(CONFIG.roadWidth, CONFIG.roadLen / CONFIG.roadCount);
    // Use MeshStandardMaterial to react to light
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    
    mesh.rotation.x = -Math.PI / 2; // Lay flat
    mesh.position.z = zPos;
    
    sceneRef.add(mesh);
    roadSegments.push(mesh);
}

function spawnBuilding(zPos) {
    const textures = loadedAssets.textures.buildings;
    const tex = textures[Math.floor(Math.random() * textures.length)];
    
    const height = 15 + Math.random() * 25; // Random height 15-40
    const width = 8 + Math.random() * 6;
    
    const geo = new THREE.BoxGeometry(width, height, width);
    // Tint the building slightly grey so it looks old and dirty
    const mat = new THREE.MeshStandardMaterial({ map: tex, color: 0x666666 }); 
    const mesh = new THREE.Mesh(geo, mat);
    
    // Place randomly on Left (-1) or Right (1) side of the road
    const side = Math.random() > 0.5 ? 1 : -1;
    mesh.position.x = side * (CONFIG.roadWidth / 2 + width / 2 + Math.random() * 3);
    mesh.position.y = height / 2;
    mesh.position.z = zPos;
    
    sceneRef.add(mesh);
    buildings.push(mesh);
}

export function updateWorld(deltaTime) {
    if (gameState.current !== STATE.PLAYING) return;

    // Calculate how fast the world moves backwards (creating the illusion of running)
    const moveSpeed = gameState.speed * 60 * deltaTime;

    // Loop Roads
    roadSegments.forEach(road => {
        road.position.z += moveSpeed;
        if (road.position.z > 10) {
            road.position.z -= CONFIG.roadLen;
        }
    });

    // Loop Buildings
    buildings.forEach(b => {
        b.position.z += moveSpeed;
        if (b.position.z > 20) {
            b.position.z -= (150 + Math.random() * 50); // Send far back with random offset
        }
    });
}
