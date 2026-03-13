import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { loadedAssets } from './assets.js';

export let playerGroup;
let mixer;
let currentAction;
let currentModelKey = null;

export function initPlayer(scene) {
    playerGroup = new THREE.Group();
    playerGroup.position.set(CONFIG.lanes[1], CONFIG.playerYOffset, 0);
    scene.add(playerGroup);

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

    // --- МАГИЯ: АВТО-ВЫРАВНИВАНИЕ РОСТА И ПОВОРОТ ---
    // 1. Поворачиваем спиной к камере
    gltf.scene.rotation.y = Math.PI; 
    
    // 2. Вычисляем текущий размер модели из Блендера
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    
    // 3. Подгоняем масштаб, чтобы высота всегда была ровно CONFIG.modelHeight (4.5)
    if (size.y > 0) {
        const scaleFactor = CONFIG.modelHeight / size.y;
        gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

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
