import { STATE } from './config.js';
import { gameState } from './gameState.js';
import { loadedAssets } from './assets.js';

export let fogMonster;
let breathingTime = 0;

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
        fogMonster.position.x += (playerGroup.position.x - fogMonster.position.x) * 0.05;
        const targetZ = playerGroup.position.z + 12;
        fogMonster.position.z += (targetZ - fogMonster.position.z) * 0.1;
        breathingTime += deltaTime * 5;
        fogMonster.position.y = 4 + Math.sin(breathingTime) * 0.5;
    } 
    else if (gameState.current === STATE.DYING) {
        fogMonster.position.z -= 15 * deltaTime; 
        fogMonster.position.y += (1.5 - fogMonster.position.y) * 0.05; 
    }
}

// <-- ДОБАВЛЕНО ДЛЯ РЕСТАРТА -->
export function resetFogMonster() {
    if (fogMonster) {
        fogMonster.position.set(0, 4, 15);
    }
}
