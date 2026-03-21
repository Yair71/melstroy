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

    // ====== FLY CAMERA (WASD + Mouse) ======
    const fly = {
        yaw: 0,
        pitch: 0,
        keys: {},
        isLocked: false,
        speed: 8,
        handlers: []
    };

    window.mellApi = api;

    async function init3D() {
        scene = new THREE.Scene();
        clock = new THREE.Clock();
        const w = window.innerWidth;
        const h = window.innerHeight;

        camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 500);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        root.appendChild(renderer.domElement);
        window.addEventListener('resize', onResize);

        const ok = await loadAssets();
        if (!ok) {
            root.innerHTML = '<h2 style="color:red;text-align:center;padding-top:50px;">Failed to load assets</h2>';
            return;
        }

        initWorld(scene);
        initThief(scene);
        initStreamer(scene);
        initInput();

        // === CAMERA SETUP ===
        if (CONFIG.debug) {
            if (roomBounds) {
                const { center, size } = roomBounds;
                const maxDim = Math.max(size.x, size.y, size.z);
                // Start above and in front of the room, looking at center
                camera.position.set(
                    center.x,
                    center.y + maxDim * 0.4,
                    center.z + maxDim * 0.8
                );
                // Calculate initial yaw/pitch to look at center
                const dx = center.x - camera.position.x;
                const dy = center.y - camera.position.y;
                const dz = center.z - camera.position.z;
                fly.yaw = Math.atan2(dx, dz);
                fly.pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
            } else {
                camera.position.set(0, 5, 10);
                fly.yaw = 0;
                fly.pitch = -0.3;
            }
            setupFlyCamera(renderer.domElement);

            // Log camera every 2 seconds
            setInterval(() => {
                const p = camera.position;
                const dir = new THREE.Vector3();
                camera.getWorldDirection(dir);
                const lookAt = p.clone().add(dir.multiplyScalar(10));
                console.log(
                    `📷 pos(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}) ` +
                    `lookAt(${lookAt.x.toFixed(2)}, ${lookAt.y.toFixed(2)}, ${lookAt.z.toFixed(2)}) ` +
                    `yaw=${(fly.yaw * 180 / Math.PI).toFixed(1)}° pitch=${(fly.pitch * 180 / Math.PI).toFixed(1)}°`
                );
            }, 2000);
        } else {
            camera.position.set(CONFIG.cameraPosition.x, CONFIG.cameraPosition.y, CONFIG.cameraPosition.z);
            camera.lookAt(CONFIG.cameraLookAt.x, CONFIG.cameraLookAt.y, CONFIG.cameraLookAt.z);
        }

        showReady();
        animate();
    }

    function setupFlyCamera(canvas) {
        // Pointer lock on click
        const onClick = () => {
            if (!fly.isLocked) {
                canvas.requestPointerLock();
            }
        };
        canvas.addEventListener('click', onClick);

        const onLockChange = () => {
            fly.isLocked = (document.pointerLockElement === canvas);
        };
        document.addEventListener('pointerlockchange', onLockChange);

        // Mouse look
        const onMouseMove = (e) => {
            if (!fly.isLocked) return;
            fly.yaw -= e.movementX * 0.002;
            fly.pitch -= e.movementY * 0.002;
            fly.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, fly.pitch));
        };
        document.addEventListener('mousemove', onMouseMove);

        // WASD + QE + Shift for speed
        const onKeyDown = (e) => {
            fly.keys[e.code] = true;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') fly.speed = 20;
        };
        const onKeyUp = (e) => {
            fly.keys[e.code] = false;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') fly.speed = 8;
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        // Scroll to change speed
        const onWheel = (e) => {
            fly.speed = Math.max(1, Math.min(50, fly.speed + (e.deltaY > 0 ? -1 : 1)));
        };
        canvas.addEventListener('wheel', onWheel, { passive: true });

        fly.handlers = [
            () => canvas.removeEventListener('click', onClick),
            () => document.removeEventListener('pointerlockchange', onLockChange),
            () => document.removeEventListener('mousemove', onMouseMove),
            () => window.removeEventListener('keydown', onKeyDown),
            () => window.removeEventListener('keyup', onKeyUp),
            () => canvas.removeEventListener('wheel', onWheel),
        ];
    }

    function updateFlyCamera(dt) {
        // Direction vectors
        const forward = new THREE.Vector3(
            Math.sin(fly.yaw) * Math.cos(fly.pitch),
            Math.sin(fly.pitch),
            Math.cos(fly.yaw) * Math.cos(fly.pitch)
        );
        const right = new THREE.Vector3(Math.sin(fly.yaw - Math.PI / 2), 0, Math.cos(fly.yaw - Math.PI / 2));
        const up = new THREE.Vector3(0, 1, 0);

        const moveSpeed = fly.speed * dt;

        if (fly.keys['KeyW']) camera.position.addScaledVector(forward, moveSpeed);
        if (fly.keys['KeyS']) camera.position.addScaledVector(forward, -moveSpeed);
        if (fly.keys['KeyA']) camera.position.addScaledVector(right, -moveSpeed);
        if (fly.keys['KeyD']) camera.position.addScaledVector(right, moveSpeed);
        if (fly.keys['KeyE'] || fly.keys['Space']) camera.position.addScaledVector(up, moveSpeed);
        if (fly.keys['KeyQ'] || fly.keys['ControlLeft']) camera.position.addScaledVector(up, -moveSpeed);

        // Apply rotation
        const euler = new THREE.Euler(fly.pitch, fly.yaw, 0, 'YXZ');
        camera.quaternion.setFromEuler(euler);
    }

    function animate() {
        if (!isRunning) return;
        animationId = requestAnimationFrame(animate);
        const dt = clock.getDelta();

        if (CONFIG.debug) {
            updateFlyCamera(dt);
        }

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
            for (const fn of fly.handlers) fn();
            cleanupInput();
            destroyUI();
            if (root) root.innerHTML = '';
            if (renderer) renderer.dispose();
        }
    };
}
