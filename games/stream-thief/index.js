// games/stream-thief/index.js
import { initInput } from './input.js';
import { initThief, updateThief } from './thief.js';
import { gameState } from './gameState.js';
import { STATE } from './config.js';

export function createGame(root, api) {
    let scene, renderer, camera, clock;
    let animationId;
    let isRunning = false;

    // Сохраняем API лобби для выдачи коинов и ачивок
    window.mellApi = api;

    function init3D() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111111); // Темная комната стримера

        clock = new THREE.Clock();

        // Камера статично смотрит на стол Мела
        camera = new THREE.PerspectiveCamera(60, root.clientWidth / root.clientHeight, 0.1, 100);
        camera.position.set(0, 6, 10);
        camera.lookAt(0, 0, -2);

        // Свет
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const monitorLight = new THREE.PointLight(0x00FF41, 1, 20); // Свечение от монитора Мела
        monitorLight.position.set(0, 5, -5);
        scene.add(monitorLight);

        // Рендерер
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(root.clientWidth, root.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Оптимизация для мобилок
        root.appendChild(renderer.domElement);

        window.addEventListener('resize', onResize);

        // Инициализация наших модулей
        initInput();
        initThief(scene);
        // initStreamer(scene); // Подключим позже
        // initLoot(scene);     // Подключим позже

        // Пока нет UI, запускаем сразу
        gameState.reset();
        gameState.current = STATE.PLAYING; 

        animate();
    }

    function animate() {
        if (!isRunning) return;
        animationId = requestAnimationFrame(animate);

        const deltaTime = clock.getDelta();

        // Обновляем логику
        updateThief(deltaTime);
        // updateStreamer(deltaTime);

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
            
            // Жесткая очистка памяти (болячка многих WebGL игр)
            if (renderer) {
                renderer.dispose();
                renderer.forceContextLoss();
            }
        }
    };
}
