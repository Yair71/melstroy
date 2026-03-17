// games/stream-thief/streamer.js
import { CONFIG, STATE, STREAMER_STATE } from './config.js';
import { gameState } from './gameState.js';

export let streamerGroup;
let headMesh;
let bodyMesh;

export function initStreamer(scene) {
    streamerGroup = new THREE.Group();
    
    // Тело стримера (в черном худи)
    const bodyGeo = new THREE.BoxGeometry(2, 2.5, 1.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 3.5, -1.2); // Сидит в кресле
    
    // Голова
    const headGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa }); // Цвет кожи
    headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 5.2, -1.0);
    
    streamerGroup.add(bodyMesh, headMesh);
    scene.add(streamerGroup);

    return streamerGroup;
}

export function updateStreamer(deltaTime) {
    if (!streamerGroup) return;
    if (gameState.current !== STATE.PLAYING) return;

    gameState.streamerTimer -= deltaTime;
    const time = Date.now();

    switch (gameState.streamerState) {
        case STREAMER_STATE.SLEEPING:
            // Анимация спокойного дыхания (тело слегка расширяется)
            const breath = 1 + Math.sin(time * 0.003) * 0.02;
            bodyMesh.scale.set(1, breath, 1);
            headMesh.rotation.x = 0.2; // Голова опущена
            headMesh.material.color.setHex(0xffccaa); // Обычный цвет

            if (gameState.streamerTimer <= 0) {
                // Переходим в фазу подозрения
                gameState.streamerState = STREAMER_STATE.WARNING;
                gameState.streamerTimer = CONFIG.streamer.warningTime;
                console.log("Стример ворочается...");
            }
            break;

        case STREAMER_STATE.WARNING:
            // Ворочается (голова трясется)
            bodyMesh.scale.set(1, 1, 1);
            headMesh.rotation.x = Math.sin(time * 0.02) * 0.1; 
            headMesh.material.color.setHex(0xffaa00); // Желтеет (ОПАСНОСТЬ!)

            if (gameState.streamerTimer <= 0) {
                // ПРОСЫПАЕТСЯ!
                gameState.streamerState = STREAMER_STATE.AWAKE;
                gameState.streamerTimer = CONFIG.streamer.awakeTime;
                console.log("СТРИМЕР ПРОСНУЛСЯ!");
            }
            break;

        case STREAMER_STATE.AWAKE:
            // Резко смотрит на стол/камеру
            headMesh.rotation.x = -0.1; // Голова поднята
            headMesh.material.color.setHex(0xff0000); // Красный (ПАЛЕВО!)

            // --- ПРОВЕРКА НА ПРОИГРЫШ ---
            // Если рука не спрятана полностью (не на базе) -> Игрок пойман!
            if (gameState.handZ < CONFIG.handBaseZ - 0.5) {
                gameState.current = STATE.CAUGHT;
                console.log("ПОТРАЧЕНО! ТЕБЯ ПОЙМАЛИ!");
                // Здесь потом вызовем Game Over экран с WebM
            } 
            else if (gameState.streamerTimer <= 0) {
                // Если игрок успел спрятать руку, стример засыпает обратно
                gameState.streamerState = STREAMER_STATE.SLEEPING;
                gameState.streamerTimer = CONFIG.streamer.sleepMin + Math.random() * (CONFIG.streamer.sleepMax - CONFIG.streamer.sleepMin);
                console.log("Фух, пронесло. Стример уснул.");
            }
            break;
    }
}
