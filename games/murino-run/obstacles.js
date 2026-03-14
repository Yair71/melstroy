import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { switchModel } from './player.js';

let sceneRef;
export const activeObstacles = [];

export function initObstacles(scene) {
    sceneRef = scene;
}

export function spawnObstacle(zPos) {
    const laneIndex = Math.floor(Math.random() * 3);
    const xPos = CONFIG.lanes[laneIndex];
    
    // type 0 = Мелкий блок (можно перепрыгнуть)
    // type 1 = Высокий блок (нужно обходить)
    // type 2 = Яма (можно перепрыгнуть)
    const type = Math.floor(Math.random() * 3);

    let mesh;

    if (type === 0 || type === 1) {
        const height = type === 0 ? 1.5 : 3.5;
        const geo = new THREE.BoxGeometry(2, height, 2);
        const mat = new THREE.MeshStandardMaterial({ color: 0x880000 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(xPos, height / 2, zPos);
    } else {
        const geo = new THREE.PlaneGeometry(3, 3);
        const mat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(xPos, 0.01, zPos);
    }

    // Сохраняем тип препятствия
    mesh.userData = { type: type, passed: false };
    sceneRef.add(mesh);
    activeObstacles.push(mesh);
}

export function updateObstacles(playerGroup, deltaTime) {
    if (gameState.current !== STATE.PLAYING) return;

    const moveSpeed = gameState.speed * 60 * deltaTime;

    for (let i = activeObstacles.length - 1; i >= 0; i--) {
        const obs = activeObstacles[i];
        obs.position.z += moveSpeed;

        // --- НОВЫЕ АРКАДНЫЕ СТОЛКНОВЕНИЯ ---
        const zDistance = Math.abs(obs.position.z - playerGroup.position.z);
        if (zDistance < 1.5) {
            const xDistance = Math.abs(obs.position.x - playerGroup.position.x);
            // Если игрок на той же линии
            if (xDistance < 1.0) {
                const obsType = obs.userData.type;
                
                if (obsType === 2) { // ЯМА
                    // Умирает, только если НЕ в прыжке
                    if (!gameState.isJumping) triggerDeath();
                } 
                else if (obsType === 0) { // МЕЛКИЙ БЛОК
                    // Умирает, только если НЕ в прыжке
                    if (!gameState.isJumping) triggerDeath();
                } 
                else if (obsType === 1) { // ВЫСОКИЙ БЛОК
                    // Умирает всегда (через него нельзя перепрыгнуть)
                    triggerDeath();
                }
            }
        }

        // Очки за прохождение
        if (obs.position.z > playerGroup.position.z + 2 && !obs.userData.passed) {
            obs.userData.passed = true;
            gameState.score += 10;
            gameState.coins += 1;
        }

        // Удаление старых препятствий
        if (obs.position.z > 15) {
            sceneRef.remove(obs);
            obs.geometry.dispose();
            obs.material.dispose();
            activeObstacles.splice(i, 1);
        }
    }

    // --- СПАВН С ЗАЩИТОЙ ОТ ДУБЛИКАТОВ ---
    gameState.spawnTimer -= deltaTime;
    if (gameState.spawnTimer <= 0) {
        let minZ = -80;
        if (activeObstacles.length > 0) {
            for (let obs of activeObstacles) {
                if (obs.position.z < minZ) minZ = obs.position.z;
            }
        }
        const safeSpawnZ = minZ - 20 - (Math.random() * 20);
        
        spawnObstacle(safeSpawnZ);
        
        gameState.spawnTimer = 1.0 + Math.random() * 1.5 - (gameState.speed * 2);
        if (gameState.spawnTimer < 0.5) gameState.spawnTimer = 0.5;
    }
}

function triggerDeath() {
    gameState.current = STATE.DYING;
    switchModel('fall');
}

export function resetObstacles() {
    for (let obs of activeObstacles) {
        sceneRef.remove(obs);
        obs.geometry.dispose();
        obs.material.dispose();
    }
    activeObstacles.length = 0;
}
