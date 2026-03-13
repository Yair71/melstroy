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
        // --- ПРЯЧЕМ ФОГА ВО ВРЕМЯ БЕГА ---
        fogMonster.visible = false; 
        
        localDeathTimer = 0;
        
        // Держим его позади камеры, чтобы он был готов к прыжку при смерти
        fogMonster.position.x = playerGroup.position.x;
        fogMonster.position.z = playerGroup.position.z + 20; 
        fogMonster.position.y = 4;
        
    }
    else if (gameState.current === STATE.DYING) {
        // --- ПОКАЗЫВАЕМ ФОГА ДЛЯ ЭПИЧНОЙ СЦЕНЫ СМЕРТИ ---
        fogMonster.visible = true; 
        
        localDeathTimer += deltaTime;
        
        // Ждем 1.7 секунды (пока камера не повернется к нему лицом)
        if (localDeathTimer > 1.7) {
            // Целевая Z - чуть перед камерой, чтобы перекрыть экран
            const targetZ = playerGroup.position.z + 1.5; 
            
            if (fogMonster.position.z > targetZ) {
                fogMonster.position.z -= 25 * deltaTime; // Быстрый рывок в лицо!
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
        fogMonster.visible = false; // Прячем при рестарте
        localDeathTimer = 0;
    }
}
