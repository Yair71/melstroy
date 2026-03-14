import { STATE } from './config.js';
import { gameState } from './gameState.js';

let camera;
let deathTimer = 0;
let dummyCam;

export function initCamera(scene) {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  dummyCam = new THREE.PerspectiveCamera();
  resetCamera();
  scene.add(camera);
  return camera;
}

export function resetCamera() {
  if (camera) {
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    deathTimer = 0;
  }
}

export function updateCamera(playerGroup, fogGroup, deltaTime) {
  if (!camera || !playerGroup) return;

  if (gameState.current === STATE.INTRO) {
    // Камера смотрит на Мела сбоку, пока он танцует на краю
    playerGroup.visible = true; // <-- Убеждаемся, что Мел видим
    camera.position.set(0, 4, playerGroup.position.z + 8);
    camera.lookAt(playerGroup.position.x, playerGroup.position.y + 3, playerGroup.position.z);
  }
  else if (gameState.current === STATE.PLAYING) {
    playerGroup.visible = true; // <-- Убеждаемся, что Мел видим
    deathTimer = 0;
    camera.position.x += (playerGroup.position.x - camera.position.x) * 0.1;
    camera.position.z = playerGroup.position.z + 12;
    camera.position.y = playerGroup.position.y + 8;
    camera.lookAt(playerGroup.position.x, playerGroup.position.y + 3, playerGroup.position.z - 5);
  }
  else if (gameState.current === STATE.DYING) {
    deathTimer += deltaTime;
    const headPos = new THREE.Vector3(playerGroup.position.x, playerGroup.position.y + 3.5, playerGroup.position.z);

    if (deathTimer < 1.2) {
      playerGroup.visible = true; // Мел все еще падает, мы его видим
      camera.lookAt(playerGroup.position);
    }
    else if (deathTimer < 1.7) {
      playerGroup.visible = false; // <-- ПРЯЧЕМ МЕЛА! Камера перешла в его голову
      camera.position.copy(headPos);
      camera.lookAt(headPos.x, headPos.y, headPos.z - 10);
    }
    else {
      playerGroup.visible = false; // <-- ПРЯЧЕМ МЕЛА! Скример Фога
      camera.position.copy(headPos);
      dummyCam.position.copy(camera.position);
      dummyCam.lookAt(fogGroup.position.x, fogGroup.position.y + 3, fogGroup.position.z);
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
