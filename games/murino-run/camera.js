// games/murino-run/camera.js
import { CONFIG } from './config.js';
import { state } from './gameState.js';
import { playerGroup } from './player.js';

export let camera;

// Настройки позиции камеры
const CAMERA_OFFSET_PLAYING = new THREE.Vector3(0, 4, 8); // Камера сзади и чуть сверху
const CAMERA_OFFSET_INTRO = new THREE.Vector3(0, 2, -6); // Камера спереди (смотрим на танец и лицо)
const CAMERA_SMOOTH_SPEED = 5;

// Переменные для анимации смерти
let deathTimer = 0;
const DEATH_ANIM_DURATION = 3; // Сколько секунд длится анимация перед концом игры
let targetQuaternion = new THREE.Quaternion();

export function setupCamera(scene, width, height) {
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    // Стартовая позиция (смотрим на Мелстроя спереди во время танца)
    camera.position.copy(CAMERA_OFFSET_INTRO);
    camera.lookAt(0, 1.5, 0);
    scene.add(camera);
}

export function updateCameraAspect(aspect) {
    if (!camera) return;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
}

export function updateCamera(delta, fogEntity) {
    if (!camera || !playerGroup) return;

    if (state.is(CONFIG.states.INTRO)) {
        // Камера плавно кружится или просто смотрит на танец
        const targetPos = playerGroup.position.clone().add(CAMERA_OFFSET_INTRO);
        camera.position.lerp(targetPos, delta * CAMERA_SMOOTH_SPEED);
        camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.5, playerGroup.position.z);
    } 
    else if (state.is(CONFIG.states.PLAYING)) {
        // Камера следует за игроком со спины (3-е лицо)
        // Мы не берем X игрока напрямую для камеры, чтобы камера не дергалась при перестроении
        const targetPos = new THREE.Vector3(
            camera.position.x * 0.9, // Легкое сглаживание по X
            playerGroup.position.y + CAMERA_OFFSET_PLAYING.y,
            playerGroup.position.z + CAMERA_OFFSET_PLAYING.z
        );
        camera.position.lerp(targetPos, delta * CAMERA_SMOOTH_SPEED);
        
        // Камера всегда смотрит чуть вперед Мелстроя
        const lookTarget = new THREE.Vector3(playerGroup.position.x, playerGroup.position.y + 1.5, playerGroup.position.z - 10);
        camera.lookAt(lookTarget);
    } 
    else if (state.is(CONFIG.states.DYING)) {
        deathTimer += delta;

        // 1. Прыгаем в голову Мелстроя (1-е лицо)
        const headPosition = playerGroup.position.clone().add(new THREE.Vector3(0, 1.8, 0));
        camera.position.lerp(headPosition, delta * 10);

        // 2. Вычисляем направление на Фога (он висит сзади по оси Z)
        if (fogEntity && deathTimer < 2) {
            // Приближаем Фога к игроку для скримера!
            fogEntity.position.z -= delta * 30; // Фог летит на нас
            
            // Заставляем камеру повернуться к Фогу
            const lookMatrix = new THREE.Matrix4().lookAt(camera.position, fogEntity.position, camera.up);
            targetQuaternion.setFromRotationMatrix(lookMatrix);
            
            // Плавно поворачиваем шею (камеру)
            camera.quaternion.slerp(targetQuaternion, delta * 3);
        }

        // 3. Переход на экран GameOver
        if (deathTimer >= DEATH_ANIM_DURATION) {
            state.set(CONFIG.states.GAMEOVER);
            deathTimer = 0; // Сбрасываем для следующих траев
            
            // Здесь будет вызов UI-события для показа кнопки "ЕЩЕ РАЗ"
            window.dispatchEvent(new CustomEvent('murinoGameOver'));
        }
    }
}
