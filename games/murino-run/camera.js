import { STATE } from './config.js';
import { gameState } from './gameState.js';

let camera;
let deathTimer = 0;

export function initCamera(scene) {
    // 75 degree FOV, standard aspect ratio
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Default 3rd person position
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    
    scene.add(camera);
    return camera;
}

export function updateCamera(playerGroup, fogGroup, deltaTime) {
    if (!camera || !playerGroup) return;

    if (gameState.current === STATE.INTRO || gameState.current === STATE.PLAYING) {
        // --- 3RD PERSON FOLLOW CAMERA ---
        deathTimer = 0; // Reset death timer
        
        // Smoothly follow player's X position (lane changes)
        camera.position.x += (playerGroup.position.x - camera.position.x) * 0.1;
        
        // Keep fixed distance behind and above the player
        camera.position.z = playerGroup.position.z + 8;
        camera.position.y = playerGroup.position.y + 4;
        
        // Always look slightly ahead of the player
        camera.lookAt(playerGroup.position.x, playerGroup.position.y + 2, playerGroup.position.z - 5);
    } 
    else if (gameState.current === STATE.DYING) {
        // --- DEATH SCREAMER SEQUENCE ---
        deathTimer += deltaTime;

        // Move camera close to player's head (1st person view transition)
        const headY = playerGroup.position.y + 2.5;
        camera.position.x += (playerGroup.position.x - camera.position.x) * 0.05;
        camera.position.y += (headY - camera.position.y) * 0.05;
        camera.position.z += (playerGroup.position.z + 1 - camera.position.z) * 0.05; // Move slightly in front of face

        // Turn around to look at the Fog Monster after 0.5 seconds
        if (fogGroup && deathTimer > 0.5) {
            const targetLook = new THREE.Vector3(
                fogGroup.position.x,
                fogGroup.position.y + 4, // Look at monster's face/body
                fogGroup.position.z
            );
            
            // Look directly at the fog
            camera.lookAt(targetLook);
        }
    }
}

// Handle window resizing
export function resizeCamera() {
    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
}
