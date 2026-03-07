// games/murino-run/world.js
import { CONFIG } from './config.js';

let sceneRef;
let roadMeshes = [];
let buildings = [];
let obstacles = [];
let coins = [];
let fogEntity;
let dustSystem;

let obstacleGeo, obstacleMat;
let coinGeo, coinMat;

const ROAD_WIDTH = 12;
const ROAD_LEN = 120;
const ROAD_COUNT = 6;
const SPAWN_Z = -300; 
const DESPAWN_Z = 20; 

let spawnTimer = 0;

export function setupWorld(scene, loadedAssets) {
    sceneRef = scene;

    // 1. Дорога
    for (let i = 0; i < ROAD_COUNT; i++) {
        const tex = loadedAssets.textures.roads[i % loadedAssets.textures.roads.length];
        const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LEN);
        const roadMat = new THREE.MeshStandardMaterial({ map: tex });
        const road = new THREE.Mesh(roadGeo, roadMat);
        
        road.rotation.x = -Math.PI / 2;
        road.position.z = -i * ROAD_LEN;
        road.receiveShadow = true;
        
        scene.add(road);
        roadMeshes.push(road);
    }

    // 2. Жуткий Фог
    fogEntity = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.MeshBasicMaterial({ 
            map: loadedAssets.textures.fog, 
            transparent: true,
            opacity: 0.9,
            depthWrite: false
        })
    );
    fogEntity.position.set(0, 10, 80); 
    scene.add(fogEntity);

    // 3. Заброшенные дома (РОВНЫЙ КОРИДОР)
    const bGeo = new THREE.BoxGeometry(10, 50, 20);
    for (let i = 0; i < 24; i++) {
        const tex = loadedAssets.textures.buildings[Math.floor(Math.random() * loadedAssets.textures.buildings.length)];
        const bMat = new THREE.MeshStandardMaterial({ map: tex });
        const building = new THREE.Mesh(bGeo, bMat);
        
        // Ставим дома ровно по краям дороги с фиксированным шагом
        building.position.z = -(i * 18); 
        building.position.x = i % 2 === 0 ? 14 : -14; 
        building.position.y = 25;
        
        scene.add(building);
        buildings.push(building);
    }

    // 4. Пыль
    const dustCount = 800;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
        dustPos[i * 3 + 0] = (Math.random() - 0.5) * 60; 
        dustPos[i * 3 + 1] = Math.random() * 15;         
        dustPos[i * 3 + 2] = (Math.random() - 0.5) * 200; 
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0x555555, size: 0.15, transparent: true, opacity: 0.6 });
    dustSystem = new THREE.Points(dustGeo, dustMat);
    scene.add(dustSystem);

    obstacleGeo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
    obstacleMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    
    coinGeo = new THREE.OctahedronGeometry(0.8);
    coinMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xaa8800, metalness: 1 });
}

function spawnRow() {
    const obsLane = Math.floor(Math.random() * 3);
    
    const obs = new THREE.Mesh(obstacleGeo, obstacleMat);
    obs.position.set(CONFIG.physics.lanes[obsLane], 1.25, SPAWN_Z);
    obs.castShadow = true;
    sceneRef.add(obs);
    obstacles.push(obs);

    const coinLane = Math.floor(Math.random() * 3);
    if (coinLane !== obsLane) {
        const coin = new THREE.Mesh(coinGeo, coinMat);
        coin.position.set(CONFIG.physics.lanes[coinLane], 1.5, SPAWN_Z);
        sceneRef.add(coin);
        coins.push(coin);
    }
}

export function updateWorld(delta, speed) {
    for (let i = 0; i < roadMeshes.length; i++) {
        roadMeshes[i].position.z += speed;
        if (roadMeshes[i].position.z > ROAD_LEN) {
            roadMeshes[i].position.z -= ROAD_LEN * ROAD_COUNT;
        }
    }

    for (let i = 0; i < buildings.length; i++) {
        buildings[i].position.z += speed;
        if (buildings[i].position.z > DESPAWN_Z) {
            buildings[i].position.z -= (24 * 18); // Закидываем обратно в конец коридора
        }
    }

    for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.rotation.y += 3 * delta; 
        c.position.z += speed;
        
        if (c.position.z > DESPAWN_Z) {
            sceneRef.remove(c);
            coins.splice(i, 1);
        }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.position.z += speed;
        
        if (obs.position.z > DESPAWN_Z) {
            sceneRef.remove(obs);
            obstacles.splice(i, 1);
        }
    }

    if (dustSystem) {
        dustSystem.rotation.y += 0.05 * delta;
        dustSystem.position.z += speed * 0.2; 
        if (dustSystem.position.z > 50) dustSystem.position.z = -50;
    }

    spawnTimer++;
    if (spawnTimer > 40 / speed) { 
        spawnRow(); 
        spawnTimer = 0; 
    }
}

export function getInteractables() {
    return { obstacles, coins, fogEntity };
}

export function removeCoin(coinMesh) {
    const index = coins.indexOf(coinMesh);
    if (index > -1) {
        sceneRef.remove(coinMesh);
        coins.splice(index, 1);
    }
}

export function resetWorld() {
    obstacles.forEach(o => sceneRef.remove(o));
    obstacles = [];
    
    coins.forEach(c => sceneRef.remove(c));
    coins = [];
    
    // Сброс домов в коридор
    for (let i = 0; i < buildings.length; i++) {
        buildings[i].position.z = -(i * 18);
    }
    
    spawnTimer = 0;
    fogEntity.position.set(0, 10, 80); 
}
