import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { loadedAssets } from './assets.js';

export let playerGroup;
let mixer; // Animation mixer for the CURRENT model
let currentAction;
let currentModelKey = null;

export function initPlayer(scene) {
    // 1. Create a container group for the player
    playerGroup = new THREE.Group();
    playerGroup.position.set(CONFIG.lanes[1], CONFIG.playerYOffset, 0);
    
    // ПРИМЕНЯЕМ МАСШТАБ ИЗ КОНФИГА!
    playerGroup.scale.set(CONFIG.modelScale, CONFIG.modelScale, CONFIG.modelScale);
    
    scene.add(playerGroup);

    // 2. Start with a random dance for the INTRO state
    const dances = ['dance1', 'dance2'];
    const randomDance = dances[Math.floor(Math.random() * dances.length)];
    switchModel(randomDance);

    return playerGroup;
}

// THE CORE MECHANIC: Swapping full .glb models instead of bones
export function switchModel(modelKey) {
    if (currentModelKey === modelKey) return; // Don't swap if already playing
    
    // 1. Clear the container (remove current model)
    while(playerGroup.children.length > 0){ 
        playerGroup.remove(playerGroup.children[0]); 
    }

    // 2. Get the new GLTF object from our preloaded assets
    const gltf = loadedAssets.models[modelKey];
    if (!gltf) {
        console.error(`Model ${modelKey} not found in loaded assets!`);
        return;
    }

    // 3. Add new model's scene to our container
    playerGroup.add(gltf.scene);
    currentModelKey = modelKey;

    // 4. Setup animation for this specific model
    if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(gltf.scene);
        currentAction = mixer.clipAction(gltf.animations[0]); // Play its built-in animation
        
        // Custom logic for the FALL animation (play once, stop at the end)
        if (modelKey === 'fall') {
            currentAction.setLoop(THREE.LoopOnce);
            currentAction.clampWhenFinished = true;
        } else {
            // Loop dances, running, etc.
            currentAction.setLoop(THREE.LoopRepeat);
        }
        
        currentAction.play();
    }
}

export function updatePlayer(deltaTime) {
    if (!playerGroup) return;

    // 1. Update the current model's animation
    if (mixer) {
        mixer.update(deltaTime);
    }

    // Don't process movement if waiting or dead
    if (gameState.current === STATE.INTRO || gameState.current === STATE.DYING) return;

    // --- HORIZONTAL MOVEMENT (Lane Switching) ---
    // Smoothly interpolate X position towards target lane
    const lerpSpeed = 10; 
    playerGroup.position.x += (gameState.targetX - playerGroup.position.x) * lerpSpeed * deltaTime;

    // --- VERTICAL MOVEMENT (Jumping & Gravity) ---
    if (gameState.isJumping) {
        gameState.velocityY += CONFIG.gravity; // Apply downward force
        playerGroup.position.y += gameState.velocityY;

        // Ground collision check
        if (playerGroup.position.y <= CONFIG.playerYOffset) {
            playerGroup.position.y = CONFIG.playerYOffset;
            gameState.isJumping = false;
            gameState.velocityY = 0;
            
            // Switch back to 'run' model when landing!
            if (gameState.current === STATE.PLAYING) {
                switchModel('run');
            }
        }
    }
}
