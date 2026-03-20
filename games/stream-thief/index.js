import { loadAssets } from './assets.js';
import { initWorld } from './world.js';
import { initStreamer, updateStreamer } from './streamer.js';
import { initThief, updateThief } from './thief.js';
import { initInput } from './input.js';
import { gameState } from './gameState.js';
import { STATE } from './config.js';

export function createGame(root, api) {
    let scene, renderer, camera, clock, animationId;
    let isRunning = false;

    async function init3D() {
        scene = new THREE.Scene();
        clock = new THREE.Clock();

        const width = window.innerWidth;
        const height = window.innerHeight;
        
        camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
        camera.position.set(0, 6, 10);
        camera.lookAt(0, 3, -3);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        root.appendChild(renderer.domElement);

        const assetsLoaded = await loadAssets();
        if (!assetsLoaded) {
            root.innerHTML = '<h2 style="color:red; text-align:center;">Ошибка загрузки моделей</h2>';
            return;
        }

        initWorld(scene);
        initStreamer(scene);
        initThief(scene);
        initInput();
        
        gameState.reset();

        animate();
    }

    function animate() {
        if (!isRunning) return;
        animationId = requestAnimationFrame(animate);

        const deltaTime = clock.getDelta();
        
        if (gameState.current === STATE.PLAYING) {
            updateStreamer(deltaTime);
            updateThief(deltaTime);
        }

        renderer.render(scene, camera);
    }

    return {
        start: () => {
            if (isRunning) return;
            isRunning = true;
            root.innerHTML = '';
            init3D();
        },
        stop: () => {
            isRunning = false;
            if (animationId) cancelAnimationFrame(animationId);
            if (root) root.innerHTML = '';
            if (renderer) renderer.dispose();
        }
    };
}
