import { loadAssets } from './assets.js';
import { initCamera, updateCamera, resizeCamera } from './camera.js';
import { initPlayer, updatePlayer, playerGroup } from './player.js';
import { initWorld, updateWorld } from './world.js';
import { initFogMonster, updateFogMonster, fogMonster } from './fog.js';
import { initObstacles, updateObstacles } from './obstacles.js';
import { initInput } from './input.js';
import { initUI, updateUI, showReadyToStart } from './ui.js'; 

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

        window.addEventListener('resize', onWindowResize);

        const assetsLoaded = await loadAssets();
        if (!assetsLoaded) {
            root.innerHTML = '<h2 style="color:red; text-align:center; padding-top:50px;">Failed to load assets. Check console.</h2>';
            return;
        }

        camera = initCamera(scene);
        initWorld(scene);
        initPlayer(scene);
        initFogMonster(scene);
        initObstacles(scene);
        initInput();

       
        showReadyToStart();

        animate();
    }

    function animate() {
        if (!isRunning) return;
        animationId = requestAnimationFrame(animate);

        const deltaTime = clock.getDelta();

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

    return {
        start: () => {
            if (isRunning) return;
            root.innerHTML = ''; 
            isRunning = true;
            
            initUI(root); 
            init3D();    
        },
        stop: () => {
            isRunning = false;
            if (animationId) cancelAnimationFrame(animationId);
            window.removeEventListener('resize', onWindowResize);
            if (root) root.innerHTML = '';
            if (renderer) renderer.dispose();
        }
    };
}
