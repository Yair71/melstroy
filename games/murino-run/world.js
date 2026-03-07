// games/murino-run/world.js
import { CONFIG } from './config.js';

let sceneRef;
let roadMeshes = [];
let buildings = [];
let obstacles = [];
let coins = [];
let fogEntity;
let dustSystem;

// Переиспользуемые геометрии и материалы
let obstacleGeo, obstacleMat;
let coinGeo, coinMat;

// Настройки генерации
const ROAD_WIDTH = 12;
const ROAD_LEN = 120;
const ROAD_COUNT = 6;
const SPAWN_Z = -300; // Где появляются препятствия
const DESPAWN_Z = 20; // Где они исчезают за спиной игрока

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
        // Расставляем куски дороги друг за другом
        road.position.z = -i * ROAD_LEN;
        road.receiveShadow = true;
        
        scene.add(road);
        roadMeshes.push(road);
    }

    // 2. Жуткий Фог (Монстр из тумана)
    fogEntity = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.MeshBasicMaterial({ 
            map: loadedAssets.textures.fog, 
            transparent: true,
            opacity: 0.9,
            depthWrite: false
        })
    );
    // Фог висит далеко позади, мы будем его придвигать при проигрыше
    fogEntity.position.set(0, 10, 80); 
    scene.add(fogEntity);

    // 3. Заброшенные дома Мурино
    const bGeo = new THREE.BoxGeometry(8, 50, 15);
    for (let i = 0; i < 24; i++) {
        const tex = loadedAssets.textures.buildings[Math.floor(Math.random() * loadedAssets.textures.buildings.length)];
        const bMat = new THREE.MeshStandardMaterial({ map: tex });
        const building = new THREE.Mesh(bGeo, bMat);
        
        // Рандомно раскидываем дома по бокам
        building.position.z = -(Math.random() * 400);
        building.position.x = Math.random() > 0.5 ? (15 + Math.random() * 5) : -(15 + Math.random() * 5);
        building.position.y = 25;
        
        scene.add(building);
        buildings.push(building);
    }

    // 4. Грязная пыль в воздухе (Атмосфера)
    const dustCount = 800;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
        dustPos[i * 3 + 0] = (Math.random() - 0.5) * 60; // x
        dustPos[i * 3 + 1] = Math.random() * 15;         // y
        dustPos[i * 3 + 2] = (Math.random() - 0.5) * 200; // z
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0x555555, size: 0.15, transparent: true, opacity: 0.6 });
    dustSystem = new THREE.Points(dustGeo, dustMat);
    scene.add(dustSystem);

    // 5. Подготовка материалов для препятствий и монет
    obstacleGeo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
    obstacleMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    
    coinGeo = new THREE.OctahedronGeometry(0.8);
    // Монеты делаем яркими, чтобы лудоманы (игроки) сразу их видели
    coinMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xaa8800, metalness: 1 });
}

function spawnRow() {
    const obsLane = Math.floor(Math.random() * 3);
    
    // Спавним препятствие
    const obs = new THREE.Mesh(obstacleGeo, obstacleMat);
    obs.position.set(CONFIG.physics.lanes[obsLane], 1.25, SPAWN_Z);
    obs.castShadow = true;
    sceneRef.add(obs);
    obstacles.push(obs);

    // Спавним монету в другой линии
    const coinLane = Math.floor(Math.random() * 3);
    if (coinLane !== obsLane) {
        const coin = new THREE.Mesh(coinGeo, coinMat);
        coin.position.set(CONFIG.physics.lanes[coinLane], 1.5, SPAWN_Z);
        sceneRef.add(coin);
        coins.push(coin);
    }
}

export function updateWorld(delta, speed) {
    // Двигаем дорогу на игрока
    for (let i = 0; i < roadMeshes.length; i++) {
        roadMeshes[i].position.z += speed;
        // Если кусок дороги ушел за спину, переносим его вперед
        if (roadMeshes[i].position.z > ROAD_LEN) {
            roadMeshes[i].position.z -= ROAD_LEN * ROAD_COUNT;
        }
    }

    // Двигаем здания
    for (let i = 0; i < buildings.length; i++) {
        buildings[i].position.z += speed;
        if (buildings[i].position.z > DESPAWN_Z) {
            buildings[i].position.z -= 400; // Уносим далеко вперед
        }
    }

    // Вращаем и двигаем монеты
    for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.rotation.y += 3 * delta; // Красивое вращение
        c.position.z += speed;
        
        // Удаляем, если пролетели мимо
        if (c.position.z > DESPAWN_Z) {
            sceneRef.remove(c);
            coins.splice(i, 1);
        }
    }

    // Двигаем препятствия
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.position.z += speed;
        
        // Удаляем, если пролетели мимо
        if (obs.position.z > DESPAWN_Z) {
            sceneRef.remove(obs);
            obstacles.splice(i, 1);
        }
    }

    // Легкая анимация пыли (атмосфера)
    if (dustSystem) {
        dustSystem.rotation.y += 0.05 * delta;
        dustSystem.position.z += speed * 0.2; // Пыль летит чуть медленнее мира
        if (dustSystem.position.z > 50) dustSystem.position.z = -50;
    }

    // Логика спавна новых объектов
    spawnTimer++;
    // Чем выше скорость, тем быстрее спавнятся препятствия
    if (spawnTimer > 40 / speed) { 
        spawnRow(); 
        spawnTimer = 0; 
    }
}

// Экспортируем массивы для проверки коллизий в главном цикле (или в player.js)
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
    // Очистка при рестарте игры
    obstacles.forEach(o => sceneRef.remove(o));
    obstacles = [];
    
    coins.forEach(c => sceneRef.remove(c));
    coins = [];
    
    buildings.forEach(b => b.position.z = -(Math.random() * 400));
    spawnTimer = 0;
    fogEntity.position.set(0, 10, 80); 
}
