import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { switchModel } from './player.js';

let sceneRef;
export const activeObstacles = [];
export const activeCoins = []; 
export const activeCracks = []; 

export function initObstacles(scene) {
  sceneRef = scene;
}

// КРАСИВЫЙ КРАТЕР ВМЕСТО КАРАКУЛЕЙ
export function spawnCrater(x, z) {
  // Ровный темный круг (ожог/вмятина) на асфальте
  const geo = new THREE.CircleGeometry(1.6, 24);
  const mat = new THREE.MeshBasicMaterial({ color: 0x030303, transparent: true, opacity: 0.85 });
  const crater = new THREE.Mesh(geo, mat);
  crater.rotation.x = -Math.PI / 2;
  crater.position.set(x, 0.03, z); // Строго над асфальтом
  sceneRef.add(crater);
  activeCracks.push(crater);
}

export function spawnObstacle(zPos) {
  const laneIndex = Math.floor(Math.random() * 3);
  const xPos = CONFIG.lanes[laneIndex];
  
  // Редкий спавн "Зерна" (шанс 10%)
  const isSeed = Math.random() < 0.10;
  let type;
  if (isSeed) type = 3;
  else type = Math.random() < 0.7 ? (Math.random() < 0.5 ? 0 : 1) : 2;

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
    // ОГРОМНОЕ ЗЕРНО (2x2)
    const geo = new THREE.IcosahedronGeometry(1.5, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.9, flatShading: true });
    mesh = new THREE.Mesh(geo, mat);
    // Спавним высоко в небе, летит прямо в игрока
    mesh.position.set(xPos, 40, zPos - 20); 
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

  // ОБНОВЛЕНИЕ КРАТЕРОВ
  for (let i = activeCracks.length - 1; i >= 0; i--) {
      const crater = activeCracks[i];
      crater.position.z += moveSpeed;
      if (crater.position.z > 15) {
          sceneRef.remove(crater);
          crater.geometry.dispose();
          crater.material.dispose();
          activeCracks.splice(i, 1);
      }
  }

  // ОБНОВЛЕНИЕ ПРЕПЯТСТВИЙ И ЗЕРЕН
  for (let i = activeObstacles.length - 1; i >= 0; i--) {
    const obs = activeObstacles[i];
    obs.position.z += moveSpeed;

    // Падение огромного зерна
    if (obs.userData.isMeteor) {
        if (obs.position.y > 1.5) {
            obs.position.y -= 60 * deltaTime; // Летит как пуля
            obs.rotation.x += 10 * deltaTime;
        } else if (!obs.userData.landed) {
            obs.position.y = 1.5; // Ложится на землю
            obs.userData.landed = true;
            spawnCrater(obs.position.x, obs.position.z); // Бабах! Кратер
        }
    }

    const zDistance = Math.abs(obs.position.z - playerGroup.position.z);
    if (zDistance < 1.5) {
      const xDistance = Math.abs(obs.position.x - playerGroup.position.x);
      if (xDistance < 1.0) {
        if (obs.userData.isHole) {
          if (playerGroup.position.y < 0.5) triggerDeath();
        } else if (obs.userData.isMeteor) {
          if (playerGroup.position.y < 3.0) triggerDeath(); // Зерно высокое
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

  // ОБНОВЛЕНИЕ МОНЕТ С АНИМАЦИЕЙ (Оставлено как просил)
  for (let i = activeCoins.length - 1; i >= 0; i--) {
      const coin = activeCoins[i];

      if (coin.userData.collected) {
          coin.position.y += 10 * deltaTime;
          coin.scale.setScalar(Math.max(0, coin.scale.x - 5 * deltaTime));
          coin.rotation.z += 20 * deltaTime;
          
          if (coin.scale.x <= 0.05) {
              sceneRef.remove(coin);
              coin.geometry.dispose();
              coin.material.dispose();
              activeCoins.splice(i, 1);
          }
          continue; 
      }

      coin.position.z += moveSpeed;
      coin.rotation.z += 5 * deltaTime;

      const zDist = Math.abs(coin.position.z - playerGroup.position.z);
      const xDist = Math.abs(coin.position.x - playerGroup.position.x);
      const yDist = Math.abs(coin.position.y - playerGroup.position.y);

      if (zDist < 1.5 && xDist < 1.5 && yDist < 2) {
          gameState.coins += 1;
          coin.userData.collected = true; 
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

  for (let crater of activeCracks) {
    sceneRef.remove(crater);
    crater.geometry.dispose();
    crater.material.dispose();
  }
  activeCracks.length = 0;
}
