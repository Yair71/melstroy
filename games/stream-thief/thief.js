import { loadedAssets } from './assets.js';
import { CONFIG, PHASE } from './config.js';
import { gameState } from './gameState.js';

export let handGroup;

export function initThief(scene) {
    handGroup = new THREE.Group();
    const handGltf = loadedAssets.models['hand'];
    
    if (handGltf) {
        handGltf.scene.scale.set(CONFIG.handScale, CONFIG.handScale, CONFIG.handScale);
        const box = new THREE.Box3().setFromObject(handGltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        handGltf.scene.position.set(-center.x, -center.y, -center.z);
        handGroup.add(handGltf.scene);
    }

    handGroup.position.set(gameState.handX, gameState.handY, gameState.handZ);
    scene.add(handGroup);
}

export function updateThief(deltaTime) {
    if (!handGroup) return;

    switch (gameState.phase) {
        case PHASE.AIM_X:
            gameState.handX += CONFIG.speedX * gameState.dirX * deltaTime;
            if (gameState.handX > CONFIG.limitX) { gameState.handX = CONFIG.limitX; gameState.dirX = -1; }
            if (gameState.handX < -CONFIG.limitX) { gameState.handX = -CONFIG.limitX; gameState.dirX = 1; }
            break;

        case PHASE.AIM_Y:
            gameState.handY += CONFIG.speedY * gameState.dirY * deltaTime;
            if (gameState.handY > CONFIG.limitYMax) { gameState.handY = CONFIG.limitYMax; gameState.dirY = -1; }
            if (gameState.handY < CONFIG.limitYMin) { gameState.handY = CONFIG.limitYMin; gameState.dirY = 1; }
            break;

        case PHASE.WAIT_Z:
            // Рука висит и ждет зажатия
            break;

        case PHASE.MOVE_Z:
            // Тянемся к столу
            gameState.handZ -= CONFIG.speedZ * deltaTime;
            break;

        case PHASE.RETURN:
            // Возвращаем руку на исходную позицию плавно (Lerp)
            gameState.handX += (CONFIG.handStartX - gameState.handX) * CONFIG.returnSpeed * deltaTime;
            gameState.handY += (CONFIG.handStartY - gameState.handY) * CONFIG.returnSpeed * deltaTime;
            gameState.handZ += (CONFIG.handStartZ - gameState.handZ) * CONFIG.returnSpeed * deltaTime;

            // Если почти вернулись - начинаем цикл заново
            if (Math.abs(gameState.handZ - CONFIG.handStartZ) < 0.1) {
                gameState.phase = PHASE.AIM_X;
            }
            break;
    }

    // Применяем позицию к 3D объекту
    handGroup.position.set(gameState.handX, gameState.handY, gameState.handZ);
}
