import { STATE } from './config.js';
import { gameState } from './gameState.js';

let camera;
let deathTimer = 0;
let dummyCam; // Невидимая камера для расчета плавного поворота шеи

export function initCamera(scene) {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    dummyCam = new THREE.PerspectiveCamera(); 
    resetCamera();
    scene.add(camera);
    return camera;
}

// МГНОВЕННЫЙ СБРОС (фиксит баг, когда при рестарте видно место смерти)
export function resetCamera() {
    if (camera) {
        camera.position.set(0, 5, 10);
        camera.lookAt(0, 0, 0);
        deathTimer = 0;
    }
}

export function updateCamera(playerGroup, fogGroup, deltaTime) {
    if (!camera || !playerGroup) return;

    if (gameState.current === STATE.INTRO || gameState.current === STATE.PLAYING) {
        deathTimer = 0;
        camera.position.x += (playerGroup.position.x - camera.position.x) * 0.1;
        camera.position.z = playerGroup.position.z + 8;
        camera.position.y = playerGroup.position.y + 4;
        camera.lookAt(playerGroup.position.x, playerGroup.position.y + 2, playerGroup.position.z - 5);
    }
    else if (gameState.current === STATE.DYING) {
        deathTimer += deltaTime;
        
        // Позиция глаз Мелстроя (от первого лица)
        const headPos = new THREE.Vector3(playerGroup.position.x, playerGroup.position.y + 3.5, playerGroup.position.z);

        if (deathTimer < 1.2) {
            // ФАЗА 1: Смотрим со стороны, как он падает (1.2 секунды)
            camera.lookAt(playerGroup.position);
        } 
        else if (deathTimer < 1.7) {
            // ФАЗА 2: Переключаемся в глаза и смотрим вперед на препятствие
            camera.position.copy(headPos);
            camera.lookAt(headPos.x, headPos.y, headPos.z - 10);
        } 
        else {
            // ФАЗА 3: Плавный поворот шеи назад на Фога
            camera.position.copy(headPos);
            
            // Направляем невидимую камеру прямо на лицо Фога
            dummyCam.position.copy(camera.position);
            dummyCam.lookAt(fogGroup.position.x, fogGroup.position.y + 3, fogGroup.position.z);
            
            // Плавно интерполируем (поворачиваем) основную камеру к невидимой
            camera.quaternion.slerp(dummyCam.quaternion, 0.08); 
        }
    }
}

export function resizeCamera() {
    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
}
