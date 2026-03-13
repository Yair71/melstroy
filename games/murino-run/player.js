import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { loadedAssets } from './assets.js';

export let playerGroup;
let mixer;
let currentAction;
let currentModelKey = null;

// Глобальные переменные для фиксации размера и высоты (чтобы не прыгали)
let globalScale = 1;
let globalYOffset = 0;

export function initPlayer(scene) {
    playerGroup = new THREE.Group();
    playerGroup.position.set(CONFIG.lanes[1], CONFIG.playerYOffset, 0);
    scene.add(playerGroup);

    // --- МАГИЯ: ВЫЧИСЛЯЕМ ИДЕАЛЬНЫЙ РОСТ И НОГИ НА ЗЕМЛЕ 1 РАЗ ПО МОДЕЛИ 'run' ---
    const runGltf = loadedAssets.models['run'];
    if (runGltf) {
        // Сброс позиций для точного замера
        runGltf.scene.position.set(0, 0, 0);
        runGltf.scene.scale.set(1, 1, 1);
        runGltf.scene.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(runGltf.scene);
        const size = box.getSize(new THREE.Vector3());

        if (size.y > 0) {
            // Фиксируем масштаб для всех
            globalScale = CONFIG.modelHeight / size.y;
            // Сдвигаем всю модель вверх ровно на ту высоту, которая проваливалась под ноль
            globalYOffset = (0 - box.min.y) * globalScale;
        }
    }

    const dances = ['dance1', 'dance2'];
    switchModel(dances[Math.floor(Math.random() * dances.length)]);

    return playerGroup;
}

export function switchModel(modelKey) {
    if (currentModelKey === modelKey) return;

    if (mixer) mixer.stopAllAction();

    while(playerGroup.children.length > 0){
        playerGroup.remove(playerGroup.children[0]);
    }

    const gltf = loadedAssets.models[modelKey];
    if (!gltf) return;

    // --- ПРИМЕНЯЕМ ЕДИНЫЕ НАСТРОЙКИ КО ВСЕМ МОДЕЛЯМ ---
    gltf.scene.rotation.y = Math.PI; // Поворот спиной
    gltf.scene.scale.set(globalScale, globalScale, globalScale); // Единый рост
    gltf.scene.position.y = globalYOffset; // Идеально на асфальте

    playerGroup.add(gltf.scene);
    currentModelKey = modelKey;

    if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(gltf.scene);
        currentAction = mixer.clipAction(gltf.animations[0]);

        if (modelKey === 'fall' || modelKey === 'jump') {
            currentAction.setLoop(THREE.LoopOnce);
            currentAction.clampWhenFinished = true;
        } else {
            currentAction.setLoop(THREE.LoopRepeat);
        }
        currentAction.play();
    }
}

export function updatePlayer(deltaTime) {
    if (!playerGroup) return;

    if (mixer) mixer.update(deltaTime);

    if (gameState.current === STATE.INTRO || gameState.current === STATE.DYING) return;

    const lerpSpeed = 10;
    playerGroup.position.x += (gameState.targetX - playerGroup.position.x) * lerpSpeed * deltaTime;

    if (gameState.isJumping) {
        gameState.velocityY += CONFIG.gravity;
        playerGroup.position.y += gameState.velocityY;

        if (playerGroup.position.y <= CONFIG.playerYOffset) {
            playerGroup.position.y = CONFIG.playerYOffset;
            gameState.isJumping = false;
            gameState.velocityY = 0;

            if (gameState.current === STATE.PLAYING) {
                switchModel('run');
            }
        }
    }
}
