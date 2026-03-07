// games/murino-run/player.js
import { CONFIG } from './config.js';
import { state } from './gameState.js';

export let playerGroup;
let mixer;
let animations = {};
let currentAction;

// Физика и позиционирование
let currentLane = 1; // 0 = Left, 1 = Center, 2 = Right
let targetX = 0;
let velocityY = 0;
let isJumping = false;

// Видео-лицо
let videoElement;
let videoTexture;
let faceMesh; 

export function setupPlayer(scene, loadedModels) {
    playerGroup = new THREE.Group();
    scene.add(playerGroup);

    // 1. Достаем базовую модель Мелстроя
    const melModel = loadedModels.player.scene;
    
    // Включаем тени для модели
    melModel.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Ищем меш лица (название зависит от твоей модели, например 'Face' или 'Head')
            // Если у тебя меш называется иначе, поменяй строку ниже
            if (child.name.toLowerCase().includes('face') || child.name.toLowerCase().includes('head')) {
                faceMesh = child; 
            }
        }
    });
    
    // Немного опускаем модель, чтобы ноги касались земли
    melModel.position.y = CONFIG.physics.playerYOffset;
    playerGroup.add(melModel);

    // 2. Настраиваем анимации (Mixer)
    mixer = new THREE.AnimationMixer(melModel);
    
    // Извлекаем клипы из загруженных GLB файлов
    animations.run = mixer.clipAction(loadedModels.run.animations[0]);
    animations.jump = mixer.clipAction(loadedModels.jump.animations[0]);
    animations.fall = mixer.clipAction(loadedModels.fall.animations[0]);
    animations.dance1 = mixer.clipAction(loadedModels.dance1.animations[0]);
    animations.dance2 = mixer.clipAction(loadedModels.dance2.animations[0]);

    // Настраиваем поведение анимаций (прыжок и падение не должны зацикливаться)
    animations.jump.setLoop(THREE.LoopOnce);
    animations.jump.clampWhenFinished = true;
    animations.fall.setLoop(THREE.LoopOnce);
    animations.fall.clampWhenFinished = true;

    // 3. Подготовка видео-текстуры для лица
    setupVideoFace();

    // 4. Запускаем рандомный танец для состояния INTRO
    playRandomDance();
    
    // Начальная позиция
    targetX = CONFIG.physics.lanes[currentLane];
    playerGroup.position.x = targetX;
}

function setupVideoFace() {
    videoElement = document.createElement('video');
    videoElement.src = CONFIG.assets.video; // './assets/mel.webm'
    videoElement.loop = true;
    videoElement.muted = true; // Обязательно muted для автоплея (звук можно добавить отдельно)
    videoElement.crossOrigin = 'anonymous';
    videoElement.style.display = 'none';
    document.body.appendChild(videoElement);

    videoTexture = new THREE.VideoTexture(videoElement);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBAFormat; // Поддержка прозрачности WebM
}

function playRandomDance() {
    const danceAction = Math.random() > 0.5 ? animations.dance1 : animations.dance2;
    fadeToAction(danceAction, 0.2);
}

// Плавный переход между анимациями
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

// Вызывается из главного цикла или инпута при старте игры
export function startRunning() {
    if (faceMesh) {
        // Применяем видео-текстуру на лицо!
        faceMesh.material.map = videoTexture;
        faceMesh.material.needsUpdate = true;
    }
    videoElement.play(); // Запускаем WebM
    
    fadeToAction(animations.run, 0.3);
}

// Управление: влево, вправо, прыжок
export function moveLane(direction) {
    if (!state.is(CONFIG.states.PLAYING) || isJumping) return;
    
    currentLane += direction;
    currentLane = Math.max(0, Math.min(2, currentLane)); // Ограничиваем от 0 до 2
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
    videoElement.pause(); // Останавливаем видос на лице
    fadeToAction(animations.fall, 0.1);
    
    // Здесь позже добавим логику вызова смерти в camera.js
}

export function updatePlayer(delta) {
    if (mixer) mixer.update(delta);

    if (state.is(CONFIG.states.PLAYING) || state.is(CONFIG.states.DYING)) {
        // Плавное перемещение по X (Лайфхак для красивого свайпа)
        playerGroup.position.x += (targetX - playerGroup.position.x) * 10 * delta;

        // Физика прыжка по Y
        if (isJumping) {
            velocityY += CONFIG.physics.gravity;
            playerGroup.position.y += velocityY;

            // Приземление
            if (playerGroup.position.y <= CONFIG.physics.playerYOffset) {
                playerGroup.position.y = CONFIG.physics.playerYOffset;
                isJumping = false;
                velocityY = 0;
                
                // Если мы все еще играем, возвращаем анимацию бега
                if (state.is(CONFIG.states.PLAYING)) {
                    fadeToAction(animations.run, 0.2);
                }
            }
        }
    }
}
