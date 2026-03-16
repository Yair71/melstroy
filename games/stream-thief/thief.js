// games/stream-thief/thief.js
import { CONFIG, STATE } from './config.js';
import { gameState, THIEF_PHASE } from './gameState.js';

export let handGroup;
export let lootItems = []; // Храним предметы на столе

export function initThief(scene) {
    handGroup = new THREE.Group();
    
    // Рука
    const armGeo = new THREE.BoxGeometry(0.8, 0.4, 6);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xffccaa }); 
    const armMesh = new THREE.Mesh(armGeo, armMat);
    armMesh.position.set(0, 0, 3); 
    
    const fingerGeo = new THREE.BoxGeometry(1.0, 0.5, 1);
    const fingerMat = new THREE.MeshStandardMaterial({ color: 0xeeaa88 });
    const fingerMesh = new THREE.Mesh(fingerGeo, fingerMat);
    fingerMesh.position.set(0, 0, -0.5); 
    
    handGroup.add(armMesh);
    handGroup.add(fingerMesh);
    scene.add(handGroup);

    // --- СОЗДАЕМ СТОЛ И ЛУТ ---
    createLootTable(scene);

    return handGroup;
}

function createLootTable(scene) {
    // Стол стримера
    const tableGeo = new THREE.BoxGeometry(10, 1, 6);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x332211 }); // Дерево
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, 1, -2);
    scene.add(table);

    // Спавним предметы из конфига
    const colors = { 'coins': 0xFFD700, 'drink': 0x00FF00, 'phone': 0x111111, 'laptop': 0xAAAAAA };
    
    CONFIG.lootItems.forEach((itemData, index) => {
        // Делаем простые блоки для предметов
        const itemGeo = new THREE.BoxGeometry(1, 1, 1);
        const itemMat = new THREE.MeshStandardMaterial({ color: colors[itemData.id] || 0xFFFFFF });
        const itemMesh = new THREE.Mesh(itemGeo, itemMat);
        
        // Расставляем их по столу на разных позициях X и Z
        const xPos = -3 + (index * 2); 
        itemMesh.position.set(xPos, 2, itemData.zPos);
        
        // Сохраняем инфу о предмете внутри меша
        itemMesh.userData = { id: itemData.id, score: itemData.score, active: true };
        
        scene.add(itemMesh);
        lootItems.push(itemMesh);
    });
}

export function updateThief(deltaTime) {
    if (!handGroup) return;
    if (gameState.current !== STATE.PLAYING && gameState.current !== STATE.CAUGHT) return;

    const speed = 8.0; // Скорость прицеливания клешни

    // ФАЗА 1: Прицел по X (Влево-вправо)
    if (gameState.thiefPhase === THIEF_PHASE.AIM_X) {
        gameState.handX += speed * gameState.aimDirX * deltaTime;
        if (gameState.handX > 4) gameState.aimDirX = -1;
        if (gameState.handX < -4) gameState.aimDirX = 1;
    }
    // ФАЗА 2: Прицел по Y (Вверх-вниз)
    else if (gameState.thiefPhase === THIEF_PHASE.AIM_Y) {
        gameState.handY += (speed * 0.7) * gameState.aimDirY * deltaTime;
        if (gameState.handY > 5) gameState.aimDirY = -1;
        if (gameState.handY < 1.5) gameState.aimDirY = 1; // Не даем опуститься ниже стола
    }
    // ФАЗА 3: Стелс по Z (Тянемся к луту)
    else if (gameState.thiefPhase === THIEF_PHASE.STEAL_Z) {
        if (gameState.isHolding) {
            gameState.handZ -= CONFIG.handExtendSpeed * deltaTime;
            checkLootCollisions(); // Проверяем, схватили ли мы что-то
        } else {
            gameState.handZ += CONFIG.handRetractSpeed * deltaTime;
            if (gameState.handZ >= CONFIG.handBaseZ) {
                gameState.handZ = CONFIG.handBaseZ;
                // Вернули руку пустой -> Сбрасываем фазы, целимся заново!
                gameState.thiefPhase = THIEF_PHASE.AIM_X; 
            }
        }
    }
    // ФАЗА 4: Возврат с лутом
    else if (gameState.thiefPhase === THIEF_PHASE.RETURNING) {
        gameState.handZ += CONFIG.handRetractSpeed * deltaTime;
        if (gameState.handZ >= CONFIG.handBaseZ) {
            gameState.handZ = CONFIG.handBaseZ;
            gameState.thiefPhase = THIEF_PHASE.AIM_X; // Снова целимся
        }
    }

    // Применяем координаты к 3D объекту
    handGroup.position.set(gameState.handX, gameState.handY, gameState.handZ);
}

function checkLootCollisions() {
    // Координаты "пальцев" (конца руки)
    const grabBox = new THREE.Box3().setFromObject(handGroup.children[1]);

    for (let item of lootItems) {
        if (!item.userData.active) continue;

        const itemBox = new THREE.Box3().setFromObject(item);

        // Если рука коснулась предмета
        if (grabBox.intersectsBox(itemBox)) {
            console.log(`Grabbed: ${item.userData.id} for ${item.userData.score} points!`);
            
            // Начисляем очки
            gameState.score += item.userData.score;
            
            // Прячем предмет (или потом прилепим к руке)
            item.visible = false;
            item.userData.active = false;
            
            // Рука сама едет назад
            gameState.thiefPhase = THIEF_PHASE.RETURNING;
            break; // Берем только один предмет за раз
        }
    }
}
