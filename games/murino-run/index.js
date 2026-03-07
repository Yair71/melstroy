// games/murino-run/index.js
import { CONFIG } from './config.js';
import { state } from './gameState.js';
// В будущем раскомментируем по мере создания файлов:
// import { setupCamera, updateCamera } from './camera.js';
// import { setupWorld, updateWorld } from './world.js';
// import { setupPlayer, updatePlayer } from './player.js';
// import { setupInput } from './input.js';

export function createGame(root, api) {
    let running = false;
    let animationId;
    let clock;
    
    // Core Three.js components
    let scene, renderer;

    function init3D() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(CONFIG.world.creepyFogColor);
        scene.fog = new THREE.FogExp2(CONFIG.world.creepyFogColor, 0.02); // Жуткий туман

        const width = root.clientWidth || window.innerWidth;
        const height = root.clientHeight || window.innerHeight;

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        root.appendChild(renderer.domElement);

        clock = new THREE.Clock();

        const ambientLight = new THREE.AmbientLight(CONFIG.world.creepyAmbientLight, 1.2);
        scene.add(ambientLight);

        // TODO: Вызовы инициализации модулей
        // setupCamera(scene, width, height);
        // setupWorld(scene);
        // setupPlayer(scene);
        // setupInput();

        window.addEventListener('resize', onWindowResize, false);
    }

    function onWindowResize() {
        if (!renderer || !root) return;
        const width = root.clientWidth || window.innerWidth;
        const height = root.clientHeight || window.innerHeight;
        renderer.setSize(width, height);
        // updateCameraAspect(width / height);
    }

    function animate() {
        if (!running) return;
        animationId = requestAnimationFrame(animate);

        const delta = clock.getDelta();

        // Основной игровой цикл разбит по модулям:
        if (state.is(CONFIG.states.PLAYING) || state.is(CONFIG.states.DYING)) {
            // updatePlayer(delta);
            // updateWorld(delta, state.speed);
        }

        // updateCamera();

        // Временно используем заглушку камеры для рендера, пока не напишем camera.js
        // renderer.render(scene, camera); 
    }

    function start() {
        if (running) return;
        running = true;
        root.innerHTML = '';
        
        init3D();
        state.set(CONFIG.states.LOADING);
        
        // TODO: Запуск загрузки ассетов (assets.js)
        console.log("Murino Run initialized. Ready for module injection.");
        // animate();
    }

    function stop() {
        running = false;
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', onWindowResize);
        root.innerHTML = "";
    }

    return { start, stop };
}
