import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { switchModel } from './player.js';

let sceneRef;

export const activeObstacles = [];
export const activeCoins = [];
export const activeCracks = [];

const crackTexturePool = {
  small: [],
  large: []
};

export function initObstacles(scene) {
  sceneRef = scene;

  if (crackTexturePool.small.length === 0) {
    for (let i = 0; i < 6; i++) {
      crackTexturePool.small.push(createCrackTexture(256, 1.0));
    }
    for (let i = 0; i < 4; i++) {
      crackTexturePool.large.push(createCrackTexture(256, 1.4));
    }
  }
}

function createCrackTexture(size = 256, intensity = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = size / 2;

  ctx.clearRect(0, 0, size, size);

  const scorch = ctx.createRadialGradient(c, c, size * 0.02, c, c, size * 0.20 * intensity);
  scorch.addColorStop(0, 'rgba(12, 10, 10, 0.95)');
  scorch.addColorStop(0.35, 'rgba(18, 16, 16, 0.60)');
  scorch.addColorStop(1, 'rgba(18, 16, 16, 0.00)');
  ctx.fillStyle = scorch;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(6, 6, 6, 0.97)';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const mainBranches = 8 + Math.floor(Math.random() * 4);
  for (let i = 0; i < mainBranches; i++) {
    const angle = (Math.PI * 2 * i) / mainBranches + (Math.random() - 0.5) * 0.45;
    const length = size * (0.12 + Math.random() * 0.12) * intensity;
    drawCrackBranch(ctx, c, c, angle, length, 3.2, 2 + Math.floor(Math.random() * 2));
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function drawCrackBranch(ctx, x, y, angle, length, width, depth) {
  let px = x;
  let py = y;
  let currentAngle = angle;

  const steps = 3 + Math.floor(Math.random() * 3);
  const segmentLength = length / steps;

  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(px, py);

  for (let i = 0; i < steps; i++) {
    currentAngle += (Math.random() - 0.5) * 0.45;
    px += Math.cos(currentAngle) * segmentLength;
    py += Math.sin(currentAngle) * segmentLength;
    ctx.lineTo(px, py);

    if (depth > 0 && Math.random() < 0.55) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const branchAngle = currentAngle + side * (0.45 + Math.random() * 0.4);
      drawCrackBranch(
        ctx, px, py, branchAngle,
        segmentLength * (0.75 + Math.random() * 0.35),
        Math.max(1, width * 0.62), depth - 1
      );
    }
  }

  ctx.stroke();
}

function createCrackMesh(scale = 1, strong = false) {
  const group = new THREE.Group();
  const pool = strong ? crackTexturePool.large : crackTexturePool.small;
  const crackTexture = pool[Math.floor(Math.random() * pool.length)];

  const crack = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4 * scale, 2.4 * scale),
    new THREE.MeshBasicMaterial({
      map: crackTexture,
      transparent: true,
      opacity: strong ? 1 : 0.94,
      depthWrite: false
    })
  );
  crack.rotation.x = -Math.PI / 2;
  crack.rotation.z = Math.random() * Math.PI * 2;
  crack.position.y = 0.035;
  group.add(crack);

  if (strong) {
    const centerBurn = new THREE.Mesh(
      new THREE.CircleGeometry(0.22 * scale, 16),
      new THREE.MeshBasicMaterial({
        color: 0x130d09,
        transparent: true,
        opacity: 0.72,
        depthWrite: false
      })
    );
    centerBurn.rotation.x = -Math.PI / 2;
    centerBurn.position.y = 0.036;
    group.add(centerBurn);
  }

  return group;
}

export function spawnCrater(x, z, scale = 1, strong = false) {
  const crackGroup = createCrackMesh(scale, strong);
  crackGroup.position.set(x, 0, z);
  sceneRef.add(crackGroup);
  activeCracks.push(crackGroup);
  return crackGroup;
}

export function spawnObstacle(zPos) {
  const laneIndex = Math.floor(Math.random() * 3);
  const xPos = CONFIG.lanes[laneIndex];

  // Выбираем только между мелкими блоками, крупными и ямами
  const type = Math.random() < 0.7 ? (Math.random() < 0.5 ? 0 : 1) : 2;

  let mesh;
  let isHole = false;
  let blockHeight = 0;

  if (type === 0 || type === 1) {
    blockHeight = type === 0 ? 1.5 : 3;
    const geo = new THREE.BoxGeometry(2, blockHeight, 2);
    const mat = new THREE.MeshStandardMaterial({ color: 0x550000 });
    mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(xPos, blockHeight / 2, zPos);
  } else if (type === 2) {
    isHole = true;
    const geo = new THREE.PlaneGeometry(3, 3);
    const mat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(xPos, 0.01, zPos);
  }

  mesh.userData = {
    isHole,
    passed: false,
    blockHeight
  };

  sceneRef.add(mesh);
  activeObstacles.push(mesh);

  spawnCoinPattern(zPos, laneIndex);
}

function spawnCoinPattern(zPos, blockedLaneIndex) {
  const availableLanes = [0, 1, 2].filter(l => l !== blockedLaneIndex);
  if (availableLanes.length === 0) return;

  const targetLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
  const xPos = CONFIG.lanes[targetLane];

  for (let i = 0; i < 3; i++) {
    const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.8,
      roughness: 0.2
    });
    const coin = new THREE.Mesh(geo, mat);
    coin.rotation.x = Math.PI / 2;
    coin.position.set(xPos, 1, zPos - (i * 2));
    coin.userData = { collected: false };
    sceneRef.add(coin);
    activeCoins.push(coin);
  }
}

function disposeObjectDeep(object) {
  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => mat.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}

function removeSceneObject(object) {
  if (!object) return;
  sceneRef.remove(object);
  disposeObjectDeep(object);
}

export function updateObstacles(playerGroup, deltaTime) {
  if (gameState.current !== STATE.PLAYING) return;

  const moveSpeed = gameState.speed * 60 * deltaTime;

  // cracks
  for (let i = activeCracks.length - 1; i >= 0; i--) {
    const crack = activeCracks[i];
    crack.position.z += moveSpeed;

    if (crack.position.z > 15) {
      removeSceneObject(crack);
      activeCracks.splice(i, 1);
    }
  }

  // obstacles
  for (let i = activeObstacles.length - 1; i >= 0; i--) {
    const obs = activeObstacles[i];
    obs.position.z += moveSpeed;

    const zDistance = Math.abs(obs.position.z - playerGroup.position.z);
    const collisionZ = 1.25;

    if (zDistance < collisionZ) {
      const xDistance = Math.abs(obs.position.x - playerGroup.position.x);

      if (xDistance < 1.05) {
        if (obs.userData.isHole) {
          if (playerGroup.position.y < 0.55) {
            triggerDeath();
          }
        } else {
          const requiredHeight =
            obs.userData.blockHeight <= 1.5
              ? CONFIG.smallBlockClearHeight
              : obs.userData.blockHeight - 0.25;

          if (playerGroup.position.y < requiredHeight) {
            triggerDeath();
          }
        }
      }
    }

    if (obs.position.z > playerGroup.position.z + 2 && !obs.userData.passed) {
      obs.userData.passed = true;
      gameState.score += 10;
    }

    if (obs.position.z > 15) {
      removeSceneObject(obs);
      activeObstacles.splice(i, 1);
    }
  }

  // coins
  for (let i = activeCoins.length - 1; i >= 0; i--) {
    const coin = activeCoins[i];

    if (coin.userData.collected) {
      coin.position.y += 10 * deltaTime;
      coin.scale.setScalar(Math.max(0, coin.scale.x - 5 * deltaTime));
      coin.rotation.z += 20 * deltaTime;

      if (coin.scale.x <= 0.05) {
        removeSceneObject(coin);
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
      removeSceneObject(coin);
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
  for (let i = activeObstacles.length - 1; i >= 0; i--) {
    removeSceneObject(activeObstacles[i]);
  }
  activeObstacles.length = 0;

  for (let i = activeCoins.length - 1; i >= 0; i--) {
    removeSceneObject(activeCoins[i]);
  }
  activeCoins.length = 0;

  for (let i = activeCracks.length - 1; i >= 0; i--) {
    removeSceneObject(activeCracks[i]);
  }
  activeCracks.length = 0;
}
