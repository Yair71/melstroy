import { loadedAssets } from './assets.js';
import { CONFIG, PHASE } from './config.js';
import { gameState } from './gameState.js';
 
export let handGroup;
 
export function initThief(scene) {
    handGroup = new THREE.Group();
 
    const handGltf = loadedAssets.models['hand'];
      if (handGltf) { 
     const hand = handGltf.scene;
        hand.scale.setScalar(CONFIG.handScale);
 
        // Center the model inside the group
        const box = new THREE.Box3().setFromObject(hand);
        const center = box.getCenter(new THREE.Vector3()); 
            hand.position.set(-center.x, -center.y, -center.z);
 
        handGroup.add(hand);
    }
 
    handGroup.position.set(gameState.handX, gameState.handY, gameState.handZ);
    if (!handGroup) return;
 
    switch (gameState.phase) {
        case PHASE.AIM_X:
            gameState.handX += CONFIG.speedX * gameState.dirX * deltaTime;
 
    switch (gameState.phase) {
        case PHASE.AIM_X:
            // Oscillate left-right
            gameState.handX += CONFIG.speedX * gameState.dirX * deltaTime;
  if (gameState.handX > CONFIG.limitX) {
                gameState.handX = CONFIG.limitX;
                gameState.dirX = -1;
            }
            if (gameState.handX < -CONFIG.limitX) {
                gameState.handX = -CONFIG.limitX;
                gameState.dirX = 1;
            }
            break;
 
        case PHASE.AIM_Y:
            // Oscillate up-down at the X where user stopped
            gameState.handY += CONFIG.speedY * gameState.dirY * deltaTime;
             if (gameState.handY > CONFIG.limitYMax) {
                gameState.handY = CONFIG.limitYMax;
                gameState.dirY = -1;
            }
            if (gameState.handY < CONFIG.limitYMin) {
                gameState.handY = CONFIG.limitYMin;
                gameState.dirY = 1;
            }
            break;
 
        case PHASE.MOVE_Z: 
              // Reach toward the table while user holds
            if (gameState.isHolding) {
                gameState.handZ -= CONFIG.speedZ * deltaTime;
                // Clamp so hand doesn't go through the table
                if (gameState.handZ < CONFIG.limitZMin) {
                    gameState.handZ = CONFIG.limitZMin;
                }
            }
            break;
 
        case PHASE.RETURN: 
             // Lerp back to starting position
            gameState.handX += (CONFIG.handStartX - gameState.handX) * CONFIG.returnSpeed * deltaTime;
            gameState.handY += (CONFIG.handStartY - gameState.handY) * CONFIG.returnSpeed * deltaTime;
            gameState.handZ += (CONFIG.handStartZ - gameState.handZ) * CONFIG.returnSpeed * deltaTime; 
             // When close enough to start, restart cycle
            if (Math.abs(gameState.handZ - CONFIG.handStartZ) < 0.15) {
                gameState.handX = CONFIG.handStartX;
                gameState.handY = CONFIG.handStartY;
                gameState.handZ = CONFIG.handStartZ;
                gameState.phase = PHASE.AIM_X;
            }
            break;
    }
    handGroup.position.set(gameState.handX, gameState.handY, gameState.handZ);
} 
