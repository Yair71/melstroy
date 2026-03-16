// games/stream-thief/thief.js
import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';

export let handGroup;

export function initThief(scene) {
    handGroup = new THREE.Group();
    
    // ВРЕМЕННАЯ ЗАГЛУШКА: Простая рука из кубиков (потом заменим на GLTF)
    const armGeo = new THREE.BoxGeometry(1, 0.5, 6);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xffccaa }); // Цвет кожи
    const armMesh = new THREE.Mesh(armGeo, armMat);
    armMesh.position.set(0, 0, 3); // Сдвигаем центр (pivot) в плечо
    
    const fingerGeo = new THREE.BoxGeometry(1.2, 0.6, 1);
    const fingerMat = new THREE.MeshStandardMaterial({ color: 0xeeaa88 });
    const fingerMesh = new THREE.Mesh(fingerGeo, fingerMat);
    fingerMesh.position.set(0, 0, -0.5); // Кисть на конце руки
    
    handGroup.add(armMesh);
    handGroup.add(fingerMesh);

    // Стартовая позиция (рука спрятана за камерой)
    handGroup.position.set(2, 2, CONFIG.handBaseZ);
    scene.add(handGroup);

    return handGroup;
}

export function updateThief(deltaTime) {
    if (!handGroup) return;
    if (gameState.current !== STATE.PLAYING && gameState.current !== STATE.CAUGHT) return;

    if (gameState.isHolding && gameState.current === STATE.PLAYING) {
        // Рука тянется к столу (Z уменьшается)
        gameState.handProgressZ -= CONFIG.handExtendSpeed * deltaTime;

        // Ограничитель (чтобы не улетела дальше ноута)
        const maxReach = -5; 
        if (gameState.handProgressZ < maxReach) {
            gameState.handProgressZ = maxReach;
        }
    } else {
        // Рука экстренно прячется (Z увеличивается)
        gameState.handProgressZ += CONFIG.handRetractSpeed * deltaTime;

        // Фиксация в стартовой точке
        if (gameState.handProgressZ > CONFIG.handBaseZ) {
            gameState.handProgressZ = CONFIG.handBaseZ;
        }
    }

    // Применяем математическую позицию к 3D объекту
    handGroup.position.z = gameState.handProgressZ;
}
