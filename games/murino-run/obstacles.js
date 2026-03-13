import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { switchModel } from './player.js';

let sceneRef;
export const activeObstacles = [];

export function initObstacles(scene) {
    sceneRef = scene;
}

export function spawnObstacle(zPos) {
    // Randomly pick a lane (0: left, 1: center, 2: right)
    const laneIndex = Math.floor(Math.random() * 3);
    const xPos = CONFIG.lanes[laneIndex];
    
    // Randomly pick obstacle type: 0 = Low Block, 1 = Tall Block, 2 = Hole
    const type = Math.floor(Math.random() * 3);
    
    let mesh;
    let isHole = false;

    if (type === 0 || type === 1) {
        // --- BLOCKS (1 or 2 high) ---
        const height = type === 0 ? 1.5 : 3; 
        const geo = new THREE.BoxGeometry(2, height, 2);
        const mat = new THREE.MeshStandardMaterial({ color: 0x880000 }); // Creepy red/rusty blocks
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(xPos, height / 2, zPos);
    } else {
        // --- HOLES ---
        isHole = true;
        const geo = new THREE.PlaneGeometry(3, 3);
        const mat = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Pitch black hole
        mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(xPos, 0.01, zPos); // Just slightly above ground
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
        
        // Move obstacles towards the player
        obs.position.z += moveSpeed;

        // --- COLLISION DETECTION ---
        // Check if obstacle is at the same Z depth as player
        const zDistance = Math.abs(obs.position.z - playerGroup.position.z);
        if (zDistance < 1.5) {
            // Check if player is in the same X lane
            const xDistance = Math.abs(obs.position.x - playerGroup.position.x);
            if (xDistance < 1.0) {
                
                // If it's a hole, player must be jumping over it
                if (obs.userData.isHole) {
                    if (playerGroup.position.y < 0.5) {
                        triggerDeath();
                    }
                } 
                // If it's a block, player must be high enough to clear it
                else {
                    const blockHeight = obs.geometry.parameters.height;
                    if (playerGroup.position.y < blockHeight - 0.2) {
                        triggerDeath();
                    }
                }
            }
        }

        // --- SCORE UPDATE ---
        // If obstacle passed the player safely
        if (obs.position.z > playerGroup.position.z + 2 && !obs.userData.passed) {
            obs.userData.passed = true;
            gameState.score += 10;
            gameState.coins += 1; // Cash for dodging!
        }

        // Remove obstacles that went too far behind the camera
        if (obs.position.z > 15) {
            sceneRef.remove(obs);
            obs.geometry.dispose();
            obs.material.dispose();
            activeObstacles.splice(i, 1);
        }
    }

    // Spawn new obstacles based on a timer
    gameState.spawnTimer -= deltaTime;
    if (gameState.spawnTimer <= 0) {
        // Spawn far ahead
        spawnObstacle(-80 - Math.random() * 40); 
        // Decrease spawn time as game gets faster
        gameState.spawnTimer = 1.0 + Math.random() * 1.5 - (gameState.speed * 2); 
        if (gameState.spawnTimer < 0.5) gameState.spawnTimer = 0.5;
    }
}

function triggerDeath() {
    console.log("CRASH! Fog is coming...");
    gameState.current = STATE.DYING;
    switchModel('fall'); // Play the fall.glb animation once
}
