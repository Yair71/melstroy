// murino-run/obstacles.js
import { CONFIG } from './config.js';
import { STATES, gameState } from './gameState.js';
import { scene } from './world.js';
import { ASSETS } from './assets.js';

export class ObstacleManager {
    constructor() {
        this.obstacles = [];
        this.spawnDistance = 100; // How far ahead to spawn
        this.lastSpawnZ = 0;
        this.spawnInterval = 20; // Distance between obstacles
        
        // Simple hitbox cache for collision
        this.hitboxSize = 1.5; 
    }

    spawnObstacle(zPos) {
        // Randomly choose a lane: -1 (Left), 0 (Center), 1 (Right)
        const lane = Math.floor(Math.random() * 3) - 1;
        const xPos = lane * CONFIG.GAME.LANE_WIDTH;

        // Randomly pick obstacle type: Block or Hole
        const isHole = Math.random() > 0.7; 
        const assetName = isHole ? 'OBSTACLE_HOLE' : 'OBSTACLE_BLOCK';
        
        // In a real scenario, use ASSETS.models[assetName].scene.clone()
        // For fallback if models are missing, we create simple meshes:
        let mesh;
        if (isHole) {
            const geo = new THREE.PlaneGeometry(3, 3);
            const mat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(xPos, 0.01, zPos);
            mesh.userData = { type: 'hole', lane: lane };
        } else {
            // Block (1 or 2 blocks high)
            const height = Math.random() > 0.8 ? 2 : 1; 
            const geo = new THREE.BoxGeometry(2, height * 2, 2);
            const mat = new THREE.MeshStandardMaterial({ color: 0x555555 });
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(xPos, height, zPos);
            mesh.userData = { type: 'block', lane: lane, height: height * 2 };
        }

        scene.add(mesh);
        this.obstacles.push(mesh);
    }

    update(player) {
        if (gameState.current !== STATES.PLAYING) return;

        const playerZ = player.group.position.z;

        // 1. Spawn new obstacles ahead of the player
        if (this.lastSpawnZ - playerZ < this.spawnDistance) {
            this.lastSpawnZ -= this.spawnInterval;
            this.spawnObstacle(this.lastSpawnZ);
        }

        // 2. Collision Detection & Cleanup
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];

            // Remove obstacles that are far behind the player
            if (obs.position.z > playerZ + 10) {
                scene.remove(obs);
                this.obstacles.splice(i, 1);
                
                // Add score/cash when successfully passing an obstacle
                gameState.addScore(10);
                if (Math.random() > 0.5) gameState.addCoin();
                continue;
            }

            // Check collision
            const zDist = Math.abs(obs.position.z - playerZ);
            const xDist = Math.abs(obs.position.x - player.group.position.x);
            
            // If close on Z and X axis
            if (zDist < 1.5 && xDist < 1.0) {
                if (obs.userData.type === 'hole') {
                    // Fell in a hole if not jumping high enough
                    if (player.group.position.y < 0.5) {
                        player.die();
                    }
                } else if (obs.userData.type === 'block') {
                    // Hit a block if not jumping over it
                    if (player.group.position.y < obs.userData.height - 0.5) {
                        player.die();
                    }
                }
            }
        }
    }

    reset() {
        this.obstacles.forEach(obs => scene.remove(obs));
        this.obstacles = [];
        this.lastSpawnZ = 0;
    }
}
