import { loadAssets } from './assets.js';
import { CONFIG } from './config.js';
import { initWorld, updateLoot, roomBounds } from './world.js';
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
    let orbitControls = null;

    window.mellApi = api;

    async function init3D() {
        scene = new THREE.Scene();
        clock = new THREE.Clock();
        const w = window.innerWidth;
        const h = window.innerHeight;

        camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 200);
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

        // Load assets
        const ok = await loadAssets();
        if (!ok) {
            root.innerHTML = '<h2 style="color:red;text-align:center;padding-top:50px;">Failed to load assets</h2>';
            return;
        }

        // Build scene
        initWorld(scene);
        initThief(scene);
        initStreamer(scene);
        initInput();

        // === DEBUG MODE: OrbitControls + auto-position camera ===
        if (CONFIG.debug) {
            // Try to use OrbitControls if available
            if (typeof THREE.OrbitControls !== 'undefined') {
                orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
                orbitControls.enableDamping = true;
                orbitControls.dampingFactor = 0.05;
                console.log('OrbitControls enabled! Drag to rotate, scroll to zoom.');
            } else {
                console.log('OrbitControls not available. Add OrbitControls script to use debug camera.');
            }

            // Auto-position camera based on room bounds
            if (roomBounds) {
                const { center, size } = roomBounds;
                const maxDim = Math.max(size.x, size.y, size.z);
                // Position camera to see the whole room
                camera.position.set(
                    center.x,
                    center.y + maxDim * 0.5,
                    center.z + maxDim * 1.0
                );
                camera.lookAt(center.x, center.y, center.z);

                if (orbitControls) {
                    orbitControls.target.copy(center);
                    orbitControls.update();
                }

                console.log('=== AUTO CAMERA POSITION ===');
                console.log(`  camera.position: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})`);
                console.log(`  lookAt: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);
            }

            // Log camera position every 3 seconds so you can find the right angle
            setInterval(() => {
                const p = camera.position;
                const t = orbitControls ? orbitControls.target : new THREE.Vector3();
                console.log(
                    `📷 Camera: pos(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}) ` +
                    `target(${t.x.toFixed(2)}, ${t.y.toFixed(2)}, ${t.z.toFixed(2)})`
                );
            }, 3000);
        }

        showReady();
        animate();
    }

    function animate() {
        if (!isRunning) return;
        animationId = requestAnimationFrame(animate);

        const dt = clock.getDelta();

        if (orbitControls) orbitControls.update();

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
