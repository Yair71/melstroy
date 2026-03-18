// games/stream-thief/index.js
import { initInput } from './input.js';
import { initThief, updateThief } from './thief.js';
import { initWorld } from './world.js'; // Подключили мир
import { initLoot } from './loot.js';   // Подключили лут
import { gameState } from './gameState.js';
import { STATE } from './config.js';

export function createGame(root, api) {
    let scene, renderer, camera, clock;
    let animationId;
    let isRunning = false;

    window.mellApi = api;

    function init3D() {
        const width = root.clientWidth || 800;
        const height = root.clientHeight || 400;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0f); // Очень темная комната

        clock = new THREE.Clock();

        camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
        camera.position.set(0, 7, 12); // Камера чуть выше, чтобы видеть весь стол
        camera.lookAt(0, 3, -3); // Смотрим в центр стола

        // Освещение комнаты
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        
        // Инициализация модулей
        initWorld(scene); // Строим комнату
        initLoot(scene);  // Спавним лут
        initThief(scene); // Создаем руку
        initInput();      // Включаем управление

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        // Включаем тени
        renderer.shadowMap.enabled = true;
        root.appendChild(renderer.domElement);

        window.addEventListener('resize', onResize);

        gameState.reset();
        gameState.current = STATE.PLAYING; 

        animate();
    }

    function animate() {
        if (!isRunning) return;
        animationId = requestAnimationFrame(animate);

        const deltaTime = clock.getDelta();

        updateThief(deltaTime);

        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    function onResize() {
        if (!camera || !renderer || !root) return;
        camera.aspect = root.clientWidth / root.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(root.clientWidth, root.clientHeight);
    }

    return {
        start: () => {
            if (isRunning) return;
            isRunning = true;
            init3D();
        },
        stop: () => {
            isRunning = false;
            if (animationId) cancelAnimationFrame(animationId);
            window.removeEventListener('resize', onResize);
            if (root) root.innerHTML = '';
            
            if (renderer) {
                renderer.dispose();
                renderer.forceContextLoss();
            }
        }
    };
}


