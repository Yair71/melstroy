import { STATE } from './config.js';
import { gameState } from './gameState.js';
import { loadedAssets } from './assets.js';

export let fogMonster;
let breathingTime = 0;

export function initFogMonster(scene) {
    const fogTex = loadedAssets.textures.fog;
    
    // Sprite material always faces the camera
    const mat = new THREE.SpriteMaterial({ map: fogTex, color: 0xffffff });
    fogMonster = new THREE.Sprite(mat);
    
    // Scale him up so he looks huge and terrifying
    fogMonster.scale.set(8, 8, 1);
    
    // Start position (behind the camera)
    fogMonster.position.set(0, 4, 15);
    
    scene.add(fogMonster);
    return fogMonster;
}

export function updateFogMonster(playerGroup, deltaTime) {
    if (!fogMonster || !playerGroup) return;

    if (gameState.current === STATE.PLAYING) {
        // --- CHASE MODE ---
        // Smoothly follow player's lane
        fogMonster.position.x += (playerGroup.position.x - fogMonster.position.x) * 0.05;
        
        // Stay exactly 12 units behind the player
        const targetZ = playerGroup.position.z + 12;
        fogMonster.position.z += (targetZ - fogMonster.position.z) * 0.1;
        
        // Creepy floating/breathing effect
        breathingTime += deltaTime * 5;
        fogMonster.position.y = 4 + Math.sin(breathingTime) * 0.5;
        
    } 
    else if (gameState.current === STATE.DYING) {
        // --- JUMPSCARE MODE ---
        // When player falls, the monster rushes forward to "eat" him
        fogMonster.position.z -= 15 * deltaTime; // Move forward FAST
        
        // Lower down towards the player's face
        fogMonster.position.y += (1.5 - fogMonster.position.y) * 0.05; 
    }
}
