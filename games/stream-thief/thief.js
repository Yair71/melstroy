// ============================================================
// thief.js — The hand: aims X, aims Y, reaches Z, returns
// FIXED: uses cloneModel() for the hand
// ============================================================
import { CONFIG, PHASE } from './config.js';
import { cloneModel } from './assets.js';
import { gameState } from './gameState.js';
import { lootItems, collectLoot } from './world.js';

export let handGroup;
let sceneRef;

export function initThief(scene) {
    sceneRef = scene;
    handGroup = new THREE.Group();

    // CLONE the hand model (not gltf.scene directly!)
    const cloned = cloneModel('hand');
    if (cloned) {
        const handScene = cloned.scene;
        handScene.scale.setScalar(CONFIG.handScale);

        // Center the hand model inside the group
        handScene.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(handScene);
        const center = box.getCenter(new THREE.Vector3());
        handScene.position.set(-center.x, -center.y, -center.z);

        handGroup.add(handScene);
    }

    // Place hand at starting coordinates
    handGroup.position.set(gameState.handX, gameState.handY, gameState.handZ);
    scene.add(handGroup);
}

export function updateThief(deltaTime) {
    if (!handGroup) return;

    switch (gameState.phase) {
        case PHASE.AIM_X:
            gameState.handX += CONFIG.speedX * gameState.dirX * deltaTime;
            if (gameState.handX > CONFIG.limitXMax) {
                gameState.handX = CONFIG.limitXMax;
                gameState.dirX = -1;
            }
            if (gameState.handX < CONFIG.limitXMin) {
                gameState.handX = CONFIG.limitXMin;
                gameState.dirX = 1;
            }
            break;

        case PHASE.AIM_Y:
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
            if (gameState.isHolding) {
                gameState.handZ += CONFIG.speedZ * deltaTime;
                if (gameState.handZ > CONFIG.limitZMax) {
                    gameState.handZ = CONFIG.limitZMax;
                }
                checkLootGrab();
            }
            break;

        case PHASE.RETURN:
            gameState.handX += (CONFIG.handStartX - gameState.handX) * CONFIG.returnSpeed * deltaTime;
            gameState.handY += (CONFIG.handStartY - gameState.handY) * CONFIG.returnSpeed * deltaTime;
            gameState.handZ += (CONFIG.handStartZ - gameState.handZ) * CONFIG.returnSpeed * deltaTime;

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
    const hp = new THREE.Vector3(gameState.handX, gameState.handY, gameState.handZ);

    for (const item of lootItems) {
        if (item.userData.collected) continue;
        const lp = new THREE.Vector3();
        item.getWorldPosition(lp);

        if (hp.distanceTo(lp) < CONFIG.grabRadius) {
            collectLoot(item);
            break;
        }
    }
}

export function resetThief() {
    if (handGroup) {
        handGroup.position.set(CONFIG.handStartX, CONFIG.handStartY, CONFIG.handStartZ);
    }
}
