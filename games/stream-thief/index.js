// ============================================================
// index.js — Main game entry, wires all modules together
// Architecture mirrors murino-run for consistency
// ============================================================
import { loadAssets } from './assets.js';
import { DEBUG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { initCamera, updateCamera, resizeCamera, cleanupCamera } from './camera.js';
import { initWorld, updateLoot } from './world.js';
import { initThief, updateThief } from './thief.js';
import { initStreamer, updateStreamer } from './streamer.js';
import { initInput, cleanupInput } from './input.js';
import { initUI, showReady, updateUI, destroyUI } from './ui.js';

export function createGame(root, api) {
    let scene, renderer, clock, camera;
    let animationId;
    let isRunning = false;

    window.mellApi = api;

    async function init3D() {
        scene = new THREE.Scene();
        clock = new THREE.Clock();

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        root.appendChild(renderer.domElement);

        window.addEventListener('resize', onResize);

        // Load all assets (loading screen is visible)
        const ok = await loadAssets();
        if (!ok) {
            root.innerHTML = '<h2 style="color:red; text-align:center; padding-top:50px;">Failed to load assets. Check console.</h2>';
            return;
        }

        // Init all modules
        camera = initCamera(scene, renderer.domElement);
        initWorld(scene);
        initThief(scene);
        initStreamer(scene);
        initInput();

        // Assets loaded — show ready screen
        showReady();

        // Start render loop
        animate();
    }

    function animate() {
        if (!isRunning) return;
        animationId = requestAnimationFrame(animate);

        const dt = clock.getDelta();

        // Always update camera (fly mode in debug)
        updateCamera(dt);

        // Game logic — only when playing
        if (gameState.current === STATE.PLAYING) {
            updateThief(dt);
            updateLoot(dt);
        }

        // Streamer always animates (swapping sitting models)
        updateStreamer(dt);

        // UI overlay
        updateUI();

        // Render
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    function onResize() {
        resizeCamera();
        if (renderer && root) {
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    return {
        start() {
            if (isRunning) return;
            root.innerHTML = '';
            isRunning = true;

            initUI(root);  // Show loading screen first
            init3D();      // Then load 3D
        },
        stop() {
            isRunning = false;
            if (animationId) cancelAnimationFrame(animationId);
            window.removeEventListener('resize', onResize);
            cleanupCamera();
            cleanupInput();
            destroyUI();
            if (root) root.innerHTML = '';
            if (renderer) renderer.dispose();
        }
    };
}
