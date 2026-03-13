import { STATE } from './config.js';
import { gameState } from './gameState.js';
import { loadedAssets } from './assets.js';

export let fogMonster;
let breathingTime = 0;
let localDeathTimer = 0;

export function initFogMonster(scene) {
    const fogTex = loadedAssets.textures.fog;
    const mat = new THREE.SpriteMaterial({ map: fogTex, color: 0xffffff });
    fogMonster = new THREE.Sprite(mat);
    fogMonster.scale.set(8, 8, 1);
    fogMonster.position.set(0, 4, 15);
    scene.add(fogMonster);
    return fogMonster;
}

export function updateFogMonster(playerGroup, deltaTime) {
    if (!fogMonster || !playerGroup) return;

    if (gameState.current === STATE.PLAYING) {
        localDeathTimer = 0;
        fogMonster.position.x += (playerGroup.position.x - fogMonster.position.x) * 0.05;
        const targetZ = playerGroup.position.z + 12;
        fogMonster.position.z += (targetZ - fogMonster.position.z) * 0.1;
        breathingTime += deltaTime * 5;
        fogMonster.position.y = 4 + Math.sin(breathingTime) * 0.5;
    }
    else if (gameState.current === STATE.DYING) {
        localDeathTimer += deltaTime;
        
        // Ждем 1.7 секунды (пока камера не повернется к нему лицом)
        if (localDeathTimer > 1.7) {
            // Целевая Z - чуть перед камерой, чтобы перекрыть экран, но не пройти насквозь
            const targetZ = playerGroup.position.z + 1.5; 
            
            if (fogMonster.position.z > targetZ) {
                fogMonster.position.z -= 25 * deltaTime; // Быстрый рывок!
            }
            
            // Летим на уровень глаз
            const headY = playerGroup.position.y + 3.5;
            fogMonster.position.y += (headY - fogMonster.position.y) * 0.1;
        }
    }
}

export function resetFogMonster() {
    if (fogMonster) {
        fogMonster.position.set(0, 4, 15);
        localDeathTimer = 0;
    }
}
