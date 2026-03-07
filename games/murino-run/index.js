// games/murino-run/index.js
import { CONFIG } from './config.js';
import { state } from './gameState.js';
import { setupWorld, updateWorld, getInteractables, removeCoin, resetWorld } from './world.js';
import { setupPlayer, updatePlayer, playerGroup, triggerDeath } from './player.js';
import { setupCamera, updateCameraAspect, updateCamera, camera } from './camera.js';
import { setupInput, cleanupInput } from './input.js';

// Загрузчики Three.js (предполагается, что THREE и GLTFLoader подключены глобально или через импорты)
// import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function createGame(root, api) {
    let running = false;
    let animationId;
    let clock;
    
    let scene, renderer;
    let loadedAssets = {
        models: {},
        textures: { roads: [], buildings: [] }
    };

    // UI Элементы
    let uiScore, uiCoins, gameOverScreen;

    function init3D() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(CONFIG.world.creepyFogColor);
        scene.fog = new THREE.FogExp2(CONFIG.world.creepyFogColor, 0.02);

        const width = root.clientWidth || window.innerWidth;
        const height = root.clientHeight || window.innerHeight;

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        root.appendChild(renderer.domElement);

        clock = new THREE.Clock();

        const ambientLight = new THREE.AmbientLight(CONFIG.world.creepyAmbientLight, 1.2);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        scene.add(dirLight);

        setupCamera(scene, width, height);
        window.addEventListener('resize', onWindowResize, false);
        window.addEventListener('murinoGameOver', showGameOverUI, false);
    }

    function buildUI() {
        // Создаем локальный UI для этой мини-игры
        const uiLayer = document.createElement('div');
        uiLayer.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:10;';
        
        const hud = document.createElement('div');
        hud.style.cssText = 'padding: 20px; font-family: monospace; font-size: 20px; color: #00FF41; text-shadow: 2px 2px 0 #000;';
        hud.innerHTML = `SCORE: <span id="runScore">0</span> | КЭШ: <span id="runCoins">0</span>`;
        uiLayer.appendChild(hud);

        gameOverScreen = document.createElement('div');
        gameOverScreen.style.cssText = 'position:absolute; inset:0; background:rgba(0,0,0,0.8); display:none; flex-direction:column; align-items:center; justify-content:center; color:#fff; pointer-events:auto;';
        gameOverScreen.innerHTML = `
            <h1 style="color:#FF003C; font-size:40px; text-shadow: 2px 2px #000;">ФОГ СЪЕЛ!</h1>
            <button id="btnRestartRun" style="padding: 15px 40px; font-size:24px; cursor:pointer; background:#00FF41; border:none; border-radius:10px; font-weight:bold;">ЕЩЕ РАЗ (ЛУДИТЬ)</button>
        `;
        uiLayer.appendChild(gameOverScreen);
        root.appendChild(uiLayer);

        uiScore = document.getElementById('runScore');
        uiCoins = document.getElementById('runCoins');
        document.getElementById('btnRestartRun').addEventListener('click', restartGame);
    }

    async function loadAssets() {
        const loadingText = document.createElement('div');
        loadingText.innerHTML = "ЗАГРУЗКА МУРИНО...";
        loadingText.style.cssText = "position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:white; font-size:24px; z-index:20;";
        root.appendChild(loadingText);

        const gltfLoader = new THREE.GLTFLoader();
        const texLoader = new THREE.TextureLoader();

        // Промисы для паралелльной загрузки (чтобы было быстро)
        const loadModel = (key, path) => new Promise(res => gltfLoader.load(path, gltf => { loadedAssets.models[key] = gltf; res(); }));
        const loadTex = (path) => new Promise(res => texLoader.load(path, tex => res(tex)));

        try {
            await Promise.all([
                loadModel('player', CONFIG.assets.models.player),
                loadModel('run', CONFIG.assets.models.run),
                loadModel('jump', CONFIG.assets.models.jump),
                loadModel('fall', CONFIG.assets.models.fall),
                loadModel('dance1', CONFIG.assets.models.dance1),
                loadModel('dance2', CONFIG.assets.models.dance2),
                loadTex(CONFIG.assets.textures.fog).then(t => loadedAssets.textures.fog = t),
                ...CONFIG.assets.textures.roads.map(p => loadTex(p).then(t => loadedAssets.textures.roads.push(t))),
                ...CONFIG.assets.textures.buildings.map(p => loadTex(p).then(t => loadedAssets.textures.buildings.push(t)))
            ]);

            root.removeChild(loadingText);
            
            // Инициализация модулей после загрузки ассетов
            setupWorld(scene, loadedAssets);
            setupPlayer(scene, loadedAssets.models);
            setupInput();
            
            state.reset(); // Переводим в INTRO
            animate();
        } catch (e) {
            console.error("Ошибка загрузки ассетов:", e);
            loadingText.innerHTML = "ОШИБКА ЗАГРУЗКИ АССЕТОВ!";
        }
    }

    function checkCollisions() {
        if (!state.is(CONFIG.states.PLAYING)) return;

        const { obstacles, coins } = getInteractables();
        const pX = playerGroup.position.x;
        const pY = playerGroup.position.y;
        const pZ = playerGroup.position.z; // Всегда около 0

        // Проверка монет
        for (let i = coins.length - 1; i >= 0; i--) {
            const coin = coins[i];
            // Если монета близко по Z и X, и игрок не перепрыгнул ее с огромным запасом
            if (Math.abs(coin.position.z - pZ) < 1.5 && Math.abs(coin.position.x - pX) < 1.0) {
                if (pY < coin.position.y + 1) {
                    state.coins += 1; // Можно умножать на донатный бустер!
                    uiCoins.innerText = state.coins;
                    removeCoin(coin);
                    // Тут можно добавить звук сбора монеты
                }
            }
        }

        // Проверка препятствий (СМЕРТЬ)
        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];
            // Хитбокс препятствия
            if (Math.abs(obs.position.z - pZ) < 1.5 && Math.abs(obs.position.x - pX) < 1.2) {
                // Проверяем высоту (смог ли перепрыгнуть)
                // Если высота игрока меньше, чем высота препятствия + небольшой запас — врезались
                if (pY < obs.position.y + 1.2) {
                    triggerDeath(); // Запускаем анимацию смерти из player.js
                    break;
                }
            }
        }
    }

    function animate() {
        if (!running) return;
        animationId = requestAnimationFrame(animate);

        const delta = Math.min(clock.getDelta(), 0.1); // Ограничиваем лаги

        if (state.is(CONFIG.states.PLAYING)) {
            // Увеличиваем скорость со временем (лудомания!)
            state.speed += CONFIG.physics.speedMultiplier * delta;
            state.score += state.speed * delta * 10;
            uiScore.innerText = Math.floor(state.score);
            
            updateWorld(delta, state.speed);
            checkCollisions();
        } else if (state.is(CONFIG.states.DYING)) {
            // Мир останавливается, работает только камера и падение
            updateWorld(delta, 0); 
        }

        updatePlayer(delta);
        
        const { fogEntity } = getInteractables();
        updateCamera(delta, fogEntity);

        renderer.render(scene, camera);
    }

    function showGameOverUI() {
        gameOverScreen.style.display = 'flex';
        // Здесь можно отправить заработанные монеты в глобальный стейт лобби (api.addCoins(state.coins))
        if (api && api.addCoins) {
            api.addCoins(state.coins);
        }
    }

    function restartGame() {
        gameOverScreen.style.display = 'none';
        resetWorld();
        state.reset(); // Возвращаем в INTRO (танцы)
        playerGroup.position.set(CONFIG.physics.lanes[1], CONFIG.physics.playerYOffset, 0);
        // Сбрасываем камеру
        setupCamera(scene, window.innerWidth, window.innerHeight);
    }

    function onWindowResize() {
        if (!renderer || !root) return;
        const width = root.clientWidth || window.innerWidth;
        const height = root.clientHeight || window.innerHeight;
        renderer.setSize(width, height);
        updateCameraAspect(width / height);
    }

    function start() {
        if (running) return;
        running = true;
        root.innerHTML = '';
        
        buildUI();
        init3D();
        loadAssets(); // Загрузит ассеты и вызовет animate()
    }

    function stop() {
        running = false;
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', onWindowResize);
        window.removeEventListener('murinoGameOver', showGameOverUI);
        cleanupInput();
        root.innerHTML = "";
    }

    return { start, stop };
}
