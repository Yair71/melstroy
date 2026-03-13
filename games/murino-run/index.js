import { loadAssets } from './assets.js';
import { initCamera, updateCamera, resizeCamera } from './camera.js';
import { initPlayer, updatePlayer, playerGroup } from './player.js';
import { initWorld, updateWorld } from './world.js';
import { initFogMonster, updateFogMonster, fogMonster } from './fog.js';
import { initObstacles, updateObstacles } from './obstacles.js';
import { initInput } from './input.js';
import { initUI, updateUI } from './ui.js';

let scene, renderer, clock;
let animationId;
let isRunning = false;
let rootContainer = null;

async function init3D() {
    // 1. Scene setup
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    // 2. Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    rootContainer.appendChild(renderer.domElement);

    // 3. Handle resize
    window.addEventListener('resize', onWindowResize);

    // 4. Load all .glb models and textures
    const assetsLoaded = await loadAssets();
    if (!assetsLoaded) {
        rootContainer.innerHTML = '<h2 style="color:red; text-align:center; padding-top:50px;">Failed to load assets. Check console.</h2>';
        return;
    }

    // 5. Initialize all game modules
    initCamera(scene);
    initWorld(scene);
    initPlayer(scene);
    initFogMonster(scene);
    initObstacles(scene);
    initInput();

    // 6. Start game loop
    animate();
}

function animate() {
    if (!isRunning) return;
    animationId = requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    // Update all modules
    updatePlayer(deltaTime);
    updateWorld(deltaTime);
    updateFogMonster(playerGroup, deltaTime);
    updateObstacles(playerGroup, deltaTime);
    updateCamera(playerGroup, fogMonster, deltaTime);
    updateUI();

    renderer.render(scene, camera);
}

function onWindowResize() {
    resizeCamera();
    if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// --- EXPORTED FUNCTIONS FOR THE LOBBY HUB ---
export function start(container) {
    if (isRunning) return;
    
    rootContainer = container;
    rootContainer.innerHTML = ''; // Clear container
    isRunning = true;

    // Initialize UI first (shows loading/start screen)
    initUI(rootContainer);

    // Initialize 3D Engine and Game
    init3D();
}

export function stop() {
    isRunning = false;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    window.removeEventListener('resize', onWindowResize);
    
    // Clean up DOM
    if (rootContainer) {
        rootContainer.innerHTML = '';
    }
    
    // Dispose renderer to prevent memory leaks
    if (renderer) {
        renderer.dispose();
    }
}
