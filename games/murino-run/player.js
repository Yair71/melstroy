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
    playerGroup.scale.set(CONFIG.modelScale, CONFIG.modelScale, CONFIG.modelScale);
    scene.add(playerGroup);

    const dances = ['dance1', 'dance2'];
    const randomDance = dances[Math.floor(Math.random() * dances.length)];
    switchModel(randomDance);

    return playerGroup;
}

export function switchModel(modelKey) {
    if (currentModelKey === modelKey) return; 
    
    // Останавливаем старые анимации перед заменой
    if (mixer) {
        mixer.stopAllAction();
    }

    while(playerGroup.children.length > 0){ 
        playerGroup.remove(playerGroup.children[0]); 
    }

    const gltf = loadedAssets.models[modelKey];
    if (!gltf) return;

    playerGroup.add(gltf.scene);
    currentModelKey = modelKey;

    if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(gltf.scene);
        
        // --- УМНЫЙ ПОИСК АНИМАЦИИ (Спасает от кривого экспорта Blender) ---
        // Ищем анимацию, в имени которой есть 'run', 'jump' и тд.
        const searchName = modelKey.replace(/[0-9]/g, ''); // убираем цифры (dance1 -> dance)
        let clip = gltf.animations.find(a => a.name.toLowerCase().includes(searchName));
        
        // Если имя не совпало, берем самую длинную анимацию в файле (игнорируя мусорные T-позы)
        if (!clip) {
            clip = gltf.animations.reduce((prev, curr) => prev.duration > curr.duration ? prev : curr);
        }

        currentAction = mixer.clipAction(clip);
        
        if (modelKey === 'fall') {
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
