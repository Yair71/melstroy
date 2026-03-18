// games/stream-thief/loot.js
import { CONFIG } from './config.js';

export const activeLoot = [];

export function initLoot(scene) {
    // Очищаем массив, если игра перезапускается
    activeLoot.length = 0;

    const colors = { 
        'coins': 0xFFD700, // Золото
        'drink': 0x00FF00, // Зеленый энергетик
        'phone': 0x444444, // Темно-серый
        'laptop': 0xDDDDDD // Серебристый
    };
    
    CONFIG.lootItems.forEach((itemData, index) => {
        // Заглушки предметов
        let itemGeo;
        if (itemData.id === 'laptop') itemGeo = new THREE.BoxGeometry(2, 0.1, 1.5);
        else if (itemData.id === 'phone') itemGeo = new THREE.BoxGeometry(0.5, 0.1, 1);
        else itemGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);

        const itemMat = new THREE.MeshStandardMaterial({ color: colors[itemData.id] || 0xFFFFFF });
        const itemMesh = new THREE.Mesh(itemGeo, itemMat);
        
        // Расставляем по столу. Высота стола в world.js = 3. 
        // Добавляем половину толщины стола (0.25) + половину высоты предмета
        const xPos = -4 + (index * 2.5); 
        itemMesh.position.set(xPos, 3.3, itemData.zPos - 1); 
        
        itemMesh.userData = { id: itemData.id, score: itemData.score, active: true };
        
        scene.add(itemMesh);
        activeLoot.push(itemMesh);
    });
}

