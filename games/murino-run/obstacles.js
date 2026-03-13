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
    const type = Math.floor(Math.random() * 3);
    
    let mesh;
    let isHole = false;

    if (type === 0 || type === 1) {
        const height = type === 0 ? 1.5 : 3; 
        const geo = new THREE.BoxGeometry(2, height, 2);
        const mat = new THREE.MeshStandardMaterial({ color: 0x880000 }); 
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(xPos, height / 2, zPos);
    } else {
        isHole = true;
        const geo = new THREE.PlaneGeometry(3, 3);
        const mat = new THREE.MeshBasicMaterial({ color: 0x000000 }); 
        mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(xPos, 0.01, zPos); 
    }

    mesh.userData = { isHole, passed: false };
    sceneRef.add(mesh);
    activeObstacles.push(mesh);
}

export function updateObstacles(playerGroup, deltaTime) {
    if (gameState.current !== STATE.PLAYING) return;

    const moveSpeed = gameState.speed * 60 * deltaTime;

    for (let i = activeObstacles.length - 1; i >= 0; i--) {
        const obs = activeObstacles[i];
        obs.position.z += moveSpeed;

        const zDistance = Math.abs(obs.position.z - playerGroup.position.z);
        if (zDistance < 1.5) {
            const xDistance = Math.abs(obs.position.x - playerGroup.position.x);
            if (xDistance < 1.0) {
                if (obs.userData.isHole) {
                    if (playerGroup.position.y < 0.5) triggerDeath();
                } else {
                    const blockHeight = obs.geometry.parameters.height;
                    if (playerGroup.position.y < blockHeight - 0.2) triggerDeath();
                }
            }
        }

        if (obs.position.z > playerGroup.position.z + 2 && !obs.userData.passed) {
            obs.userData.passed = true;
            gameState.score += 10;
            gameState.coins += 1; 
        }

        if (obs.position.z > 15) {
            sceneRef.remove(obs);
            obs.geometry.dispose();
            obs.material.dispose();
            activeObstacles.splice(i, 1);
        }
    }

    gameState.spawnTimer -= deltaTime;
    if (gameState.spawnTimer <= 0) {
        spawnObstacle(-80 - Math.random() * 40); 
        gameState.spawnTimer = 1.0 + Math.random() * 1.5 - (gameState.speed * 2); 
        if (gameState.spawnTimer < 0.5) gameState.spawnTimer = 0.5;
    }
}

function triggerDeath() {
    gameState.current = STATE.DYING;
    switchModel('fall'); 
}

// <-- ДОБАВЛЕНО ДЛЯ РЕСТАРТА -->
export function resetObstacles() {
    for (let obs of activeObstacles) {
        sceneRef.remove(obs);
        obs.geometry.dispose();
        obs.material.dispose();
    }
    activeObstacles.length = 0;
}
