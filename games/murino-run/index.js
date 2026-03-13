// murino-run/index.js
import { CONFIG } from './config.js';
import { STATES, gameState } from './gameState.js';
import { preloadAllAssets } from './assets.js';
import { initWorld, updateWorld, render, camera, dummyCamera } from './world.js';
import { Player } from './player.js';
import { ObstacleManager } from './obstacles.js';
import { FogMonster } from './fog.js';
import { UIManager } from './ui.js';

let isRunning = false;
let animationFrameId;
let clock;

// Game Objects
let player;
let obstacleManager;
let fogMonster;
let uiManager;

// Controls setup (Keyboard & Touch)
function setupInputs() {
    window.addEventListener('keydown', (e) => {
        if (gameState.current !== STATES.PLAYING) return;
        if (e.key === 'ArrowLeft' || e.key === 'a') player.moveLeft();
        if (e.key === 'ArrowRight' || e.key === 'd') player.moveRight();
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') player.jump();
    });

    // Touch Swipes for Mobile (Crucial for TikTok traffic!)
    let touchStartX = 0;
    let touchStartY = 0;
    window.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, {passive: true});

    window.addEventListener('touchend', e => {
        if (gameState.current !== STATES.PLAYING) return;
        let touchEndX = e.changedTouches[0].screenX;
        let touchEndY = e.changedTouches[0].screenY;
        
        let dx = touchEndX - touchStartX;
        let dy = touchEndY - touchStartY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal swipe
            if (dx > 30) player.moveRight();
            else if (dx < -30) player.moveLeft();
        } else {
            // Vertical swipe
            if (dy < -30) player.jump(); // Swipe up
        }
    }, {passive: true});
}

function updateCamera(delta) {
    if (gameState.current === STATES.PLAYING || gameState.current === STATES.INTRO) {
        // Standard 3rd person follow camera
        const targetPos = player.group.position.clone();
        
        // Smoothly follow player
        camera.position.x += (targetPos.x + CONFIG.CAMERA.NORMAL.OFFSET.x - camera.position.x) * 5 * delta;
        camera.position.y += (targetPos.y + CONFIG.CAMERA.NORMAL.OFFSET.y - camera.position.y) * 5 * delta;
        camera.position.z = targetPos.z + CONFIG.CAMERA.NORMAL.OFFSET.z;
        
        // Look ahead
        const lookAtTarget = targetPos.clone().add(new THREE.Vector3(
            CONFIG.CAMERA.NORMAL.LOOK_AT.x,
            CONFIG.CAMERA.NORMAL.LOOK_AT.y,
            CONFIG.CAMERA.NORMAL.LOOK_AT.z
        ));
        camera.lookAt(lookAtTarget);

        // Sync dummy camera for smooth transition later
        dummyCamera.position.copy(camera.position);
        dummyCamera.quaternion.copy(camera.quaternion);
    } 
    else if (gameState.current === STATES.DYING) {
        // Cinematic: First person view, neck turning back to see Fog
        const headPos = player.group.position.clone().add(
            new THREE.Vector3(CONFIG.CAMERA.DEATH.OFFSET.x, CONFIG.CAMERA.DEATH.OFFSET.y, CONFIG.CAMERA.DEATH.OFFSET.z)
        );
        
        // Move camera to head position fast
        camera.position.lerp(headPos, 8 * delta);

        // Calculate target rotation (looking behind)
        const lookBackTarget = headPos.clone().add(new THREE.Vector3(0, 0, CONFIG.CAMERA.DEATH.LOOK_BACK_Z));
        dummyCamera.position.copy(camera.position);
        dummyCamera.lookAt(lookBackTarget);

        // Slerp (smoothly rotate) camera quaternion to simulate neck turning
        camera.quaternion.slerp(dummyCamera.quaternion, CONFIG.CAMERA.DEATH.TURN_SPEED * delta);
    }
}

function loop() {
    if (!isRunning) return;
    animationFrameId = requestAnimationFrame(loop);

    const delta = Math.min(clock.getDelta(), 0.1); // Cap delta to avoid physics glitches on lag
    
    if (gameState.current === STATES.PLAYING) {
        gameState.speedMultiplier += CONFIG.GAME.ACCELERATION * delta;
        const currentSpeed = CONFIG.GAME.INITIAL_SPEED * gameState.speedMultiplier;
        
        player.update(delta, currentSpeed);
        obstacleManager.update(player);
        updateWorld(player.group.position.z);
        
        // Add passive score based on distance
        gameState.addScore(currentSpeed * delta);
    } 
    else if (gameState.current === STATES.DYING) {
        // Only update animations and fog monster during death sequence
        player.update(delta, 0); 
        fogMonster.update(delta, camera);
        
        // Trigger fog monster logic once
        if (fogMonster.deathTimer === 0) {
            fogMonster.startDeathSequence(player.group.position.z, player.group.position.x);
        }
    }
    else if (gameState.current === STATES.INTRO) {
        player.update(delta, 0); // Keep dance animation playing
    }

    updateCamera(delta);
    render();
}

// ... (весь код index.js, что был до этого, оставляем без изменений) ...

// Hub Integration
export function createGame(mount, api) {
    let stateListener = null;

    return {
        start: async () => {
            if (isRunning) return;
            
            // Reset state
            gameState.reset();
            
            // Init ThreeJS World
            initWorld(mount);
            
            // Preload all GLB models and textures
            await preloadAllAssets();

            // Init Entities
            player = new Player();
            obstacleManager = new ObstacleManager();
            fogMonster = new FogMonster();
            
            // Init UI
            uiManager = new UIManager(mount, 
                // onStart
                () => {
                    gameState.set(STATES.PLAYING);
                    player.startGame();
                },
                // onRestart
                () => {
                    gameState.reset();
                    player.group.position.set(0, 0, 0);
                    player.lane = 0;
                    player.targetX = 0;
                    obstacleManager.reset();
                    fogMonster.reset();
                    player.switchModel(Math.random() > 0.5 ? 'dance1' : 'dance2');
                    if (player.videoFace) player.videoFace.visible = false;
                }
            );

            // HUB API BRIDGE: Sync cash and scores to the global profile
            stateListener = (data) => {
                if (data.state === STATES.GAME_OVER) {
                    if (data.coins > 0) api.addCoins(data.coins);
                    if (data.score > 0) {
                        api.setHighScore(Math.floor(data.score));
                        api.addXp(Math.floor(data.score / 10)); // Give some XP for the Battle Pass
                    }
                }
            };
            gameState.subscribe(stateListener);

            setupInputs();

            // Start Game Loop
            isRunning = true;
            clock = new THREE.Clock();
            loop();
        },

        stop: () => {
            isRunning = false;
            cancelAnimationFrame(animationFrameId);
            if (uiManager) uiManager.destroy();
            
            // Remove the listener so we don't multiply them on rejoin
            if (stateListener) {
                gameState.listeners = gameState.listeners.filter(l => l !== stateListener);
            }

            // Cleanup ThreeJS to free memory when returning to lobby
            if (renderer) {
                renderer.dispose();
                mount.innerHTML = ''; // Clear canvas
            }
        }
    };
}
