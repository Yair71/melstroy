import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { switchModel } from './player.js';

let sceneRef;
export const activeObstacles = [];
export const activeCoins = []; 
export const activeCracks = []; // Массив для трещин/кратеров

export function initObstacles(scene) {
  sceneRef = scene;
}

// Создает трещину/кратер на асфальте
export function spawnCrack(x, z) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x020202 });
  
  // Создаем эффект рваной трещины из 3-х пересекающихся плоскостей
  for(let i=0; i<3; i++) {
      const geo = new THREE.PlaneGeometry(1.5 + Math.random(), 0.3);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = Math.random() * Math.PI;
      group.add(mesh);
  }
  
  group.position.set(x, 0.02, z); // Чуть выше асфальта
  sceneRef.add(group);
  activeCracks.push(group);
}

export function spawnObstacle(zPos) {
  const laneIndex = Math.floor(Math.random() * 3);
  const xPos = CONFIG.lanes[laneIndex];
  const type = Math.floor(Math.random() * 4); // Добавили 4-й тип (Метеорит)

  let mesh;
  let isHole = false;
  let isMeteor = false;

  if (type === 0 || type === 1) {
    const height = type === 0 ? 1.5 : 3;
    const geo = new THREE.BoxGeometry(2, height, 2);
    const mat = new THREE.MeshStandardMaterial({ color: 0x550000 });
    mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(xPos, height / 2, zPos);
  } else if (type === 2) {
    isHole = true;
    const geo = new THREE.PlaneGeometry(3, 3);
    const mat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(xPos, 0.01, zPos);
  } else {
    isMeteor = true;
    const geo = new THREE.DodecahedronGeometry(1.2, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xaa0000 });
    mesh = new THREE.Mesh(geo, mat);
    // Метеорит спавнится высоко в небе, чуть позади своей Z-позиции
    mesh.position.set(xPos, 30, zPos - 15); 
  }

  mesh.userData = { isHole, isMeteor, passed: false, landed: false };
  sceneRef.add(mesh);
  activeObstacles.push(mesh);

  spawnCoinPattern(zPos, laneIndex);
}

function spawnCoinPattern(zPos, blockedLaneIndex) {
    const availableLanes = [0, 1, 2].filter(l => l !== blockedLaneIndex);
    if(availableLanes.length === 0) return;
    const targetLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    const xPos = CONFIG.lanes[targetLane];
    
    for(let i=0; i<3; i++) {
        const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
        const mat = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.2 });
        const coin = new THREE.Mesh(geo, mat);
        coin.rotation.x = Math.PI / 2;
        coin.position.set(xPos, 1, zPos - (i * 2));
        coin.userData = { collected: false };
        sceneRef.add(coin);
        activeCoins.push(coin);
    }
}

export function updateObstacles(playerGroup, deltaTime) {
  if (gameState.current !== STATE.PLAYING) return;

  const moveSpeed = gameState.speed * 60 * deltaTime;

  // ОБНОВЛЕНИЕ ТРЕЩИН
  for (let i = activeCracks.length - 1; i >= 0; i--) {
      const crack = activeCracks[i];
      crack.position.z += moveSpeed;
      if (crack.position.z > 15) {
          sceneRef.remove(crack);
          crack.children.forEach(c => c.geometry.dispose());
          activeCracks.splice(i, 1);
      }
  }

  // ОБНОВЛЕНИЕ ПРЕПЯТСТВИЙ И МЕТЕОРИТОВ
  for (let i = activeObstacles.length - 1; i >= 0; i--) {
    const obs = activeObstacles[i];
    obs.position.z += moveSpeed;

    // Падение метеорита
    if (obs.userData.isMeteor) {
        if (obs.position.y > 1.2) {
            obs.position.y -= 40 * deltaTime; // Быстро падает
            obs.rotation.x += 10 * deltaTime;
        } else if (!obs.userData.landed) {
            obs.position.y = 1.2;
            obs.userData.landed = true;
            spawnCrack(obs.position.x, obs.position.z); // Оставляет кратер при ударе!
        }
    }

    const zDistance = Math.abs(obs.position.z - playerGroup.position.z);
    if (zDistance < 1.5) {
      const xDistance = Math.abs(obs.position.x - playerGroup.position.x);
      if (xDistance < 1.0) {
        if (obs.userData.isHole) {
          if (playerGroup.position.y < 0.5) triggerDeath();
        } else if (obs.userData.isMeteor) {
          if (playerGroup.position.y < 2.0) triggerDeath();
        } else {
          const blockHeight = obs.geometry.parameters.height;
          if (playerGroup.position.y < blockHeight - 0.2) triggerDeath();
        }
      }
    }

    if (obs.position.z > playerGroup.position.z + 2 && !obs.userData.passed) {
      obs.userData.passed = true;
      gameState.score += 10;
    }

    if (obs.position.z > 15) {
      sceneRef.remove(obs);
      obs.geometry.dispose();
      obs.material.dispose();
      activeObstacles.splice(i, 1);
    }
  }

  // ОБНОВЛЕНИЕ МОНЕТ С АНИМАЦИЕЙ
  for (let i = activeCoins.length - 1; i >= 0; i--) {
      const coin = activeCoins[i];

      if (coin.userData.collected) {
          // Анимация поднятия: летит вверх и уменьшается
          coin.position.y += 10 * deltaTime;
          coin.scale.setScalar(Math.max(0, coin.scale.x - 5 * deltaTime));
          coin.rotation.z += 20 * deltaTime;
          
          if (coin.scale.x <= 0.05) {
              sceneRef.remove(coin);
              coin.geometry.dispose();
              coin.material.dispose();
              activeCoins.splice(i, 1);
          }
          continue; // Если собрана, пропускаем логику столкновений
      }

      coin.position.z += moveSpeed;
      coin.rotation.z += 5 * deltaTime;

      const zDist = Math.abs(coin.position.z - playerGroup.position.z);
      const xDist = Math.abs(coin.position.x - playerGroup.position.x);
      const yDist = Math.abs(coin.position.y - playerGroup.position.y);

      // Сбор монеты
      if (zDist < 1.5 && xDist < 1.5 && yDist < 2) {
          gameState.coins += 1;
          coin.userData.collected = true; // Запускает анимацию
      }

      if (coin.position.z > 15) {
          sceneRef.remove(coin);
          coin.geometry.dispose();
          coin.material.dispose();
          activeCoins.splice(i, 1);
      }
  }

  gameState.spawnTimer -= deltaTime;
  if (gameState.spawnTimer <= 0) {
    spawnObstacle(-80 - Math.random() * 40);
    gameState.spawnTimer = 1.0 + Math.random() * 1.5 - (gameState.speed * 2);
    if (gameState.spawnTimer < 0.5) gameState.spawnTimer = 0.5;
  }
}

function triggerDeath() {
  gameState.current = STATE.DYING;
  switchModel('fall');
}

export function resetObstacles() {
  for (let obs of activeObstacles) {
    sceneRef.remove(obs);
    obs.geometry.dispose();
    obs.material.dispose();
  }
  activeObstacles.length = 0;
  
  for (let coin of activeCoins) {
    sceneRef.remove(coin);
    coin.geometry.dispose();
    coin.material.dispose();
  }
  activeCoins.length = 0;

  for (let crack of activeCracks) {
    sceneRef.remove(crack);
    crack.children.forEach(c => c.geometry.dispose());
  }
  activeCracks.length = 0;
}
