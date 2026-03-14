import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { switchModel } from './player.js';

let sceneRef;

export const activeObstacles = [];
export const activeCoins = [];
export const activeCracks = [];

const activeImpactBursts = [];
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

  ctx.fillStyle = 'rgba(10, 8, 8, 0.92)';
  ctx.beginPath();
  const points = 10;
  for (let i = 0; i < points; i++) {
    const angle = (Math.PI * 2 * i) / points;
    const radius = size * (0.02 + Math.random() * 0.022) * intensity;
    const px = c + Math.cos(angle) * radius;
    const py = c + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

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
        ctx,
        px,
        py,
        branchAngle,
        segmentLength * (0.75 + Math.random() * 0.35),
        Math.max(1, width * 0.62),
        depth - 1
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

// kept same name so you do not need to change imports in other files
export function spawnCrater(x, z, scale = 1, strong = false) {
  const crackGroup = createCrackMesh(scale, strong);
  crackGroup.position.set(x, 0, z);
  sceneRef.add(crackGroup);
  activeCracks.push(crackGroup);
  return crackGroup;
}

function spawnMeteorImpact(x, z) {
  const burst = new THREE.Group();
  burst.position.set(x, 0, z);

  const flash = new THREE.Mesh(
    new THREE.CircleGeometry(0.4, 18),
    new THREE.MeshBasicMaterial({
      color: 0xffd28c,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  flash.rotation.x = -Math.PI / 2;
  flash.position.y = 0.07;
  burst.add(flash);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.42, 24),
    new THREE.MeshBasicMaterial({
      color: 0xff7a1a,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  burst.add(ring);

  const sparks = [];
  for (let i = 0; i < 8; i++) {
    const spark = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.12),
      new THREE.MeshBasicMaterial({
        color: 0xff9340,
        transparent: true,
        opacity: 0.95
      })
    );
    spark.position.set(
      (Math.random() - 0.5) * 0.5,
      0.14 + Math.random() * 0.12,
      (Math.random() - 0.5) * 0.5
    );
    spark.userData = {
      vx: (Math.random() - 0.5) * 5.5,
      vy: 2.8 + Math.random() * 2.2,
      vz: (Math.random() - 0.5) * 5.5
    };
    burst.add(spark);
    sparks.push(spark);
  }

  burst.userData = { age: 0, flash, ring, sparks };
  sceneRef.add(burst);
  activeImpactBursts.push(burst);
}

export function spawnObstacle(zPos) {
  const laneIndex = Math.floor(Math.random() * 3);
  const xPos = CONFIG.lanes[laneIndex];

  const isSeed = Math.random() < 0.10;
  let type;
  if (isSeed) type = 3;
  else type = Math.random() < 0.7 ? (Math.random() < 0.5 ? 0 : 1) : 2;

  let mesh;
  let isHole = false;
  let isMeteor = false;
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
  } else {
    isMeteor = true;

    const meteor = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(CONFIG.meteorSize * 0.5, 1),
      new THREE.MeshStandardMaterial({
        color: 0x2b1d14,
        roughness: 0.9,
        metalness: 0.05,
        flatShading: true
      })
    );
    core.scale.set(1.05, 0.95, 1.05);
    meteor.add(core);

    const glow = new THREE.Mesh(
      new THREE.IcosahedronGeometry(CONFIG.meteorSize * 0.62, 0),
      new THREE.MeshBasicMaterial({
        color: 0xff7a1a,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    meteor.add(glow);

    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(CONFIG.meteorSize * 0.45, 3.2, 12, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffa347,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    tail.rotation.x = -Math.PI / 2;
    tail.position.z = -1.8;
    tail.position.y = 0.15;
    meteor.add(tail);

    meteor.position.set(
      xPos,
      CONFIG.meteorSpawnYOffset + Math.random() * 6,
      Math.max(zPos + 18, -72)
    );

    meteor.userData = {
      isHole: false,
      isMeteor: true,
      passed: false,
      landed: false,
      blockHeight: 0,
      hitHeight: CONFIG.meteorImpactY,
      fallSpeed: CONFIG.meteorFallSpeed + Math.random() * 6,
      glow,
      tail,
      impactAnim: 0,
      animTime: 0
    };

    mesh = meteor;
  }

  if (!isMeteor) {
    mesh.userData = {
      isHole,
      isMeteor,
      passed: false,
      landed: false,
      blockHeight
    };
  }

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

function updateMeteorObstacle(obs, deltaTime) {
  obs.userData.animTime += deltaTime * 10;

  const glow = obs.userData.glow;
  const tail = obs.userData.tail;

  if (!obs.userData.landed) {
    obs.position.y -= obs.userData.fallSpeed * deltaTime;
    obs.rotation.x += 6.5 * deltaTime;
    obs.rotation.y += 4.2 * deltaTime;

    if (tail) {
      const pulse = 0.9 + Math.sin(obs.userData.animTime * 2.8) * 0.08;
      tail.scale.x = pulse;
      tail.scale.y = 1.0 + Math.sin(obs.userData.animTime * 3.6) * 0.12;
      tail.scale.z = 1.0 + Math.cos(obs.userData.animTime * 2.4) * 0.10;
      tail.material.opacity = 0.28 + (Math.sin(obs.userData.animTime * 5.0) + 1) * 0.08;
    }

    if (glow) {
      const glowPulse = 1.0 + Math.sin(obs.userData.animTime * 3.2) * 0.05;
      glow.scale.set(glowPulse, glowPulse, glowPulse);
      glow.material.opacity = 0.18 + (Math.sin(obs.userData.animTime * 4.8) + 1) * 0.05;
    }

    if (obs.position.y <= obs.userData.hitHeight) {
      obs.position.y = obs.userData.hitHeight;
      obs.userData.landed = true;
      obs.userData.impactAnim = 0.22;

      if (tail) tail.visible = false;

      spawnCrater(obs.position.x, obs.position.z, 1.65, true);
      spawnMeteorImpact(obs.position.x, obs.position.z);
    }
  } else {
    if (obs.userData.impactAnim > 0) {
      obs.userData.impactAnim -= deltaTime;
      const t = 1 - Math.max(obs.userData.impactAnim, 0) / 0.22;

      obs.scale.x = 1.18 - t * 0.18;
      obs.scale.y = 0.82 + t * 0.18;
      obs.scale.z = 1.18 - t * 0.18;
    } else {
      obs.scale.x += (1 - obs.scale.x) * 0.16;
      obs.scale.y += (1 - obs.scale.y) * 0.16;
      obs.scale.z += (1 - obs.scale.z) * 0.16;

      if (glow) {
        glow.material.opacity *= 0.92;
      }
    }
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

  // impact bursts
  for (let i = activeImpactBursts.length - 1; i >= 0; i--) {
    const burst = activeImpactBursts[i];
    burst.position.z += moveSpeed;
    burst.userData.age += deltaTime;

    const t = burst.userData.age / 0.45;

    burst.userData.flash.scale.setScalar(1 + t * 1.8);
    burst.userData.flash.material.opacity = Math.max(0, 0.9 - t * 1.3);

    burst.userData.ring.scale.setScalar(1 + t * 4.4);
    burst.userData.ring.material.opacity = Math.max(0, 0.82 - t * 0.95);

    for (const spark of burst.userData.sparks) {
      spark.position.x += spark.userData.vx * deltaTime;
      spark.position.y += spark.userData.vy * deltaTime;
      spark.position.z += spark.userData.vz * deltaTime;
      spark.userData.vy -= 11 * deltaTime;
      spark.material.opacity = Math.max(0, 1 - t * 1.2);
    }

    if (t >= 1 || burst.position.z > 15) {
      removeSceneObject(burst);
      activeImpactBursts.splice(i, 1);
    }
  }

  // obstacles
  for (let i = activeObstacles.length - 1; i >= 0; i--) {
    const obs = activeObstacles[i];
    obs.position.z += moveSpeed;

    if (obs.userData.isMeteor) {
      updateMeteorObstacle(obs, deltaTime);
    }

    const zDistance = Math.abs(obs.position.z - playerGroup.position.z);
    const collisionZ = obs.userData.isMeteor ? 1.45 : 1.25;

    if (zDistance < collisionZ) {
      const xDistance = Math.abs(obs.position.x - playerGroup.position.x);

      if (xDistance < 1.05) {
        if (obs.userData.isHole) {
          if (playerGroup.position.y < 0.55) {
            triggerDeath();
          }
        } else if (obs.userData.isMeteor) {
          if ((obs.userData.landed || obs.position.y < 3.2) && playerGroup.position.y < 1.35) {
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

  for (let i = activeImpactBursts.length - 1; i >= 0; i--) {
    removeSceneObject(activeImpactBursts[i]);
  }
  activeImpactBursts.length = 0;
}


