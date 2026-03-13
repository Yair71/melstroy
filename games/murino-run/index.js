import { loadAssets } from './assets.js';
import { initCamera, updateCamera, resizeCamera } from './camera.js';
import { initPlayer, updatePlayer, playerGroup } from './player.js';
import { initWorld, updateWorld } from './world.js';
import { initFogMonster, updateFogMonster, fogMonster } from './fog.js';
import { initObstacles, updateObstacles } from './obstacles.js';
import { initInput } from './input.js';
import { initUI, updateUI } from './ui.js';

export function createGame(root, api) {
    let scene, renderer, clock, camera;
    let animationId;
    let isRunning = false;

    // Exporting hub API globally so our UI can reward coins upon death
    window.mellApi = api;

    async function init3D() {
        // 1. Scene setup
        scene = new THREE.Scene();
        clock = new THREE.Clock();

        // 2. Renderer setup
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        root.appendChild(renderer.domElement);

        // 3. Handle resize
        window.addEventListener('resize', onWindowResize);

        // 4. Load all .glb models and textures
        const assetsLoaded = await loadAssets();
        if (!assetsLoaded) {
            root.innerHTML = '<h2 style="color:red; text-align:center; padding-top:50px;">Failed to load assets. Check console.</h2>';
            return;
        }

        // 5. Initialize all game modules
        camera = initCamera(scene);
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

        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    function onWindowResize() {
        resizeCamera();
        if (renderer && root) {
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    // --- RETURN THE OBJECT EXPECTED BY THE HUB ---
    return {
        start: () => {
            if (isRunning) return;
            root.innerHTML = ''; // Clear container
            isRunning = true;
            
            // Initialize UI first (shows loading/start screen)
            initUI(root);
            
            // Initialize 3D Engine and Game
            init3D();
        },
        stop: () => {
            isRunning = false;
            
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            window.removeEventListener('resize', onWindowResize);
            
            // Clean up DOM and memory
            if (root) root.innerHTML = '';
            if (renderer) renderer.dispose();
        }
    };
}
