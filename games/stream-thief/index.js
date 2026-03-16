// games/stream-thief/index.js
import { initInput } from './input.js';
import { initThief, updateThief } from './thief.js';
import { gameState } from './gameState.js';
import { STATE } from './config.js';

export function createGame(root, api) {
    let scene, renderer, camera, clock;
    let animationId;
    let isRunning = false;

    window.mellApi = api;

    function init3D() {
        // Если root имеет нулевую высоту (бывает при загрузке), ставим дефолт
        const width = root.clientWidth || 800;
        const height = root.clientHeight || 400;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x222233); // Сделал фон синеватым для теста

        clock = new THREE.Clock();

        // Отодвигаем камеру дальше (Z = 15), чтобы видеть руку
        camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
        camera.position.set(0, 5, 15); 
        camera.lookAt(0, 0, 0);

        // Свет
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        
        const monitorLight = new THREE.PointLight(0x00FF41, 1, 20); 
        monitorLight.position.set(0, 3, -2);
        scene.add(monitorLight);

        // Рендерер
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        root.appendChild(renderer.domElement);

        window.addEventListener('resize', onResize);

        // Инициализация
        initInput();
        initThief(scene);

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
