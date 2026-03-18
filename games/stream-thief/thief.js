// games/stream-thief/thief.js
import { CONFIG, STATE } from './config.js';
import { gameState, THIEF_PHASE } from './gameState.js';
import { activeLoot } from './loot.js'; // Подключаем лут!

export let handGroup;

export function initThief(scene) {
    handGroup = new THREE.Group();
    
    const armGeo = new THREE.BoxGeometry(0.6, 0.3, 8); // Сделал руку длиннее
    const armMat = new THREE.MeshStandardMaterial({ color: 0xffccaa }); 
    const armMesh = new THREE.Mesh(armGeo, armMat);
    armMesh.position.set(0, 0, 4); 
    
    const fingerGeo = new THREE.BoxGeometry(0.8, 0.4, 1);
    const fingerMat = new THREE.MeshStandardMaterial({ color: 0xeeaa88 });
    const fingerMesh = new THREE.Mesh(fingerGeo, fingerMat);
    fingerMesh.position.set(0, 0, -0.5); 
    
    handGroup.add(armMesh);
    handGroup.add(fingerMesh);
    scene.add(handGroup);

    return handGroup;
}

export function updateThief(deltaTime) {
    if (!handGroup) return;
    if (gameState.current !== STATE.PLAYING && gameState.current !== STATE.CAUGHT) return;

    const speedX = 10.0; 
    const speedY = 6.0;

    // ФАЗА 1: Прицел по X
    if (gameState.thiefPhase === THIEF_PHASE.AIM_X) {
        gameState.handX += speedX * gameState.aimDirX * deltaTime;
        if (gameState.handX > 6) gameState.aimDirX = -1;
        if (gameState.handX < -6) gameState.aimDirX = 1;
    }
    // ФАЗА 2: Прицел по Y
    else if (gameState.thiefPhase === THIEF_PHASE.AIM_Y) {
        gameState.handY += speedY * gameState.aimDirY * deltaTime;
        if (gameState.handY > 6) gameState.aimDirY = -1;
        if (gameState.handY < 3.2) gameState.aimDirY = 1; // Упирается в стол
    }
    // ФАЗА 3: Ожидание (READY_Z) - Рука стоит на месте, ждет пробел.
    else if (gameState.thiefPhase === THIEF_PHASE.READY_Z) {
        // Ничего не делаем
    }
    // ФАЗА 4: Стелс по Z (Зажали пробел)
    else if (gameState.thiefPhase === THIEF_PHASE.STEAL_Z) {
        if (gameState.isHolding) {
            gameState.handZ -= CONFIG.handExtendSpeed * deltaTime;
            
            // ОГРАНИЧИТЕЛЬ: Рука не может уйти дальше стены
            const minZ = -6.0; 
            if (gameState.handZ < minZ) {
                gameState.handZ = minZ;
            }

            checkLootCollisions();
        } 
        // Если отпустили в файле input.js, фаза меняется на RETURNING
    }
    // ФАЗА 5: Возврат
    else if (gameState.thiefPhase === THIEF_PHASE.RETURNING) {
        gameState.handZ += CONFIG.handRetractSpeed * deltaTime;
        if (gameState.handZ >= CONFIG.handBaseZ) {
            gameState.handZ = CONFIG.handBaseZ;
            gameState.thiefPhase = THIEF_PHASE.AIM_X; // Цикл пошел заново
        }
    }

    handGroup.position.set(gameState.handX, gameState.handY, gameState.handZ);
}

function checkLootCollisions() {
    const grabBox = new THREE.Box3().setFromObject(handGroup.children[1]);

    for (let item of activeLoot) {
        if (!item.userData.active) continue;

        const itemBox = new THREE.Box3().setFromObject(item);

        if (grabBox.intersectsBox(itemBox)) {
            console.log(`УКРАЛ: ${item.userData.id}! +${item.userData.score}`);
            
            gameState.score += item.userData.score;
            item.visible = false;
            item.userData.active = false;
            
            gameState.isHolding = false;
            gameState.thiefPhase = THIEF_PHASE.RETURNING; // Сразу едем назад
            break; 
        }
    }
}


