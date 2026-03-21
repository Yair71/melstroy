import { loadAssets } from './assets.js';
import { CONFIG } from './config.js';
import { initWorld, updateLoot } from './world.js';
import { initThief, updateThief } from './thief.js';
import { initStreamer, updateStreamer } from './streamer.js';
import { initInput, cleanupInput } from './input.js';
import { initUI, showReady, updateUI, destroyUI } from './ui.js';
import { gameState } from './gameState.js';
import { STATE } from './config.js';

export function createGame(root, api) {
    let scene, renderer, clock, camera;
    let animationId;
    let isRunning = false;

    window.mellApi = api;

    async function init3D() {
        scene = new THREE.Scene();
        clock = new THREE.Clock();
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Camera matches the Blender camera perspective
        camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
        camera.position.set(
            CONFIG.cameraPosition.x,
            CONFIG.cameraPosition.y,
            CONFIG.cameraPosition.z
        );
        camera.lookAt(
            CONFIG.cameraLookAt.x,
            CONFIG.cameraLookAt.y,
            CONFIG.cameraLookAt.z
        );

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        root.appendChild(renderer.domElement);
        window.addEventListener('resize', onResize);

        // Load all assets (loading screen is visible)
        const ok = await loadAssets();
        if (!ok) {
            root.innerHTML = '<h2 style="color:red;text-align:center;padding-top:50px;">Failed to load assets</h2>';
            return;
        }

        // Build the scene
        initWorld(scene);
        initThief(scene);
        initStreamer(scene);
        initInput();

        // Assets loaded - show "tap to start"
        showReady();

        // Start render loop
        animate();
    }

    function animate() {
        if (!isRunning) return;
        animationId = requestAnimationFrame(animate);

        const dt = clock.getDelta();

        if (gameState.current === STATE.PLAYING) {
            updateThief(dt);
            updateLoot(dt);
        }
        updateStreamer(dt);
        updateUI();

        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    function onResize() {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    return {
        start() {
            if (isRunning) return;
            root.innerHTML = '';
            isRunning = true;
            initUI(root);
            init3D();
        },
        stop() {
            isRunning = false;
            if (animationId) cancelAnimationFrame(animationId);
            window.removeEventListener('resize', onResize);
            cleanupInput();
            destroyUI();
            if (root) root.innerHTML = '';
            if (renderer) renderer.dispose();
        }
    };
}
