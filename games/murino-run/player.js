// games/murino-run/player.js
import { CONFIG } from './config.js';
import { state } from './gameState.js';

export let playerGroup;
let mixer;
let animations = {};
let currentAction;

let currentLane = 1; 
let targetX = 0;
let velocityY = 0;
let isJumping = false;

let videoElement;
let videoTexture;
let faceMesh; 

// === ФИКС ДЛЯ КОСТЕЙ (Убирает вытягивание модельки) ===
function fixAnimationBones(clip) {
    if (!clip) return clip;
    const newClip = clip.clone();
    newClip.tracks = newClip.tracks.filter(track => {
        const isScale = track.name.endsWith('.scale');
        const isPosition = track.name.endsWith('.position');
        const isRoot = track.name.toLowerCase().includes('hips') || track.name.toLowerCase().includes('root');
        
        if (isScale) return false; 
        if (isPosition && !isRoot) return false; 
        return true;
    });
    return newClip;
}

export function setupPlayer(scene, loadedModels) {
    playerGroup = new THREE.Group();
    scene.add(playerGroup);

    const melModel = loadedModels.player.scene;
    
    melModel.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.name.toLowerCase().includes('face') || child.name.toLowerCase().includes('head')) {
                faceMesh = child; 
            }
        }
    });
    
    melModel.position.y = CONFIG.physics.playerYOffset;
    playerGroup.add(melModel);

    mixer = new THREE.AnimationMixer(melModel);
    
    // Применяем фикс к каждой анимации
    animations.run = mixer.clipAction(fixAnimationBones(loadedModels.run.animations[0]));
    animations.jump = mixer.clipAction(fixAnimationBones(loadedModels.jump.animations[0]));
    animations.fall = mixer.clipAction(fixAnimationBones(loadedModels.fall.animations[0]));
    animations.dance1 = mixer.clipAction(fixAnimationBones(loadedModels.dance1.animations[0]));
    animations.dance2 = mixer.clipAction(fixAnimationBones(loadedModels.dance2.animations[0]));

    animations.jump.setLoop(THREE.LoopOnce);
    animations.jump.clampWhenFinished = true;
    animations.fall.setLoop(THREE.LoopOnce);
    animations.fall.clampWhenFinished = true;

    setupVideoFace();
    playRandomDance();
    
    targetX = CONFIG.physics.lanes[currentLane];
    playerGroup.position.x = targetX;
}

function setupVideoFace() {
    videoElement = document.createElement('video');
    videoElement.src = CONFIG.assets.video; 
    videoElement.loop = true;
    videoElement.muted = true; 
    videoElement.crossOrigin = 'anonymous';
    videoElement.style.display = 'none';
    document.body.appendChild(videoElement);

    videoTexture = new THREE.VideoTexture(videoElement);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBAFormat; 
}

function playRandomDance() {
    const danceAction = Math.random() > 0.5 ? animations.dance1 : animations.dance2;
    fadeToAction(danceAction, 0.2);
}

function fadeToAction(action, duration) {
    if (currentAction === action) return;
    
    const previousAction = currentAction;
    currentAction = action;
    
    if (previousAction) {
        previousAction.fadeOut(duration);
    }
    
    currentAction.reset()
                 .setEffectiveTimeScale(1)
                 .setEffectiveWeight(1)
                 .fadeIn(duration)
                 .play();
}

export function startRunning() {
    if (faceMesh) {
        faceMesh.material.map = videoTexture;
        faceMesh.material.needsUpdate = true;
    }
    videoElement.play(); 
    fadeToAction(animations.run, 0.3);
}

export function moveLane(direction) {
    if (!state.is(CONFIG.states.PLAYING) || isJumping) return;
    
    currentLane += direction;
    currentLane = Math.max(0, Math.min(2, currentLane)); 
    targetX = CONFIG.physics.lanes[currentLane];
}

export function triggerJump() {
    if (!state.is(CONFIG.states.PLAYING) || isJumping) return;
    
    isJumping = true;
    velocityY = CONFIG.physics.jumpPower;
    fadeToAction(animations.jump, 0.2);
}

export function triggerDeath() {
    state.set(CONFIG.states.DYING);
    videoElement.pause(); 
    fadeToAction(animations.fall, 0.1);
}

export function updatePlayer(delta) {
    if (mixer) mixer.update(delta);

    if (state.is(CONFIG.states.PLAYING) || state.is(CONFIG.states.DYING)) {
        playerGroup.position.x += (targetX - playerGroup.position.x) * 10 * delta;

        if (isJumping) {
            velocityY += CONFIG.physics.gravity;
            playerGroup.position.y += velocityY;

            if (playerGroup.position.y <= CONFIG.physics.playerYOffset) {
                playerGroup.position.y = CONFIG.physics.playerYOffset;
                isJumping = false;
                velocityY = 0;
                
                if (state.is(CONFIG.states.PLAYING)) {
                    fadeToAction(animations.run, 0.2);
                }
            }
        }
    }
}
