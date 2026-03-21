import { loadedAssets } from './assets.js';
import { CONFIG, PHASE } from './config.js';
import { gameState } from './gameState.js';
import { lootItems, collectLoot } from './world.js';

export let handGroup;
let sceneRef;

export function initThief(scene) {
    sceneRef = scene;
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

    // Start position: near camera, bottom-right (like in Blender screenshot)
    handGroup.position.set(gameState.handX, gameState.handY, gameState.handZ);
    scene.add(handGroup);
}

export function updateThief(deltaTime) {
    if (!handGroup) return;

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
            // Oscillate up-down at locked X
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
            // Reach into the room while user holds
            if (gameState.isHolding) {
                gameState.handZ -= CONFIG.speedZ * deltaTime;
                if (gameState.handZ < CONFIG.limitZMin) {
                    gameState.handZ = CONFIG.limitZMin;
                }

                // Check for loot grab while reaching
                checkLootGrab();
            }
            break;

        case PHASE.RETURN:
            // Lerp back to starting position
            gameState.handX += (CONFIG.handStartX - gameState.handX) * CONFIG.returnSpeed * deltaTime;
            gameState.handY += (CONFIG.handStartY - gameState.handY) * CONFIG.returnSpeed * deltaTime;
            gameState.handZ += (CONFIG.handStartZ - gameState.handZ) * CONFIG.returnSpeed * deltaTime;

            // When close enough, restart cycle
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

function checkLootGrab() {
    if (!handGroup) return;

    const handPos = new THREE.Vector3(gameState.handX, gameState.handY, gameState.handZ);
    const grabRadius = 1.5; // How close the hand needs to be to grab

    for (const loot of lootItems) {
        if (loot.userData.collected) continue;

        const lootPos = new THREE.Vector3();
        loot.getWorldPosition(lootPos);

        const dist = handPos.distanceTo(lootPos);
        if (dist < grabRadius) {
            collectLoot(loot, sceneRef);
            break; // Grab one at a time
        }
    }
}
