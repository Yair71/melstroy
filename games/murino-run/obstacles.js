import { CONFIG, STATE } from './config.js';
import { gameState } from './gameState.js';
import { switchModel } from './player.js';

let sceneRef;
export const activeObstacles = [];
export const activeCoins   = [];
export const activeCracks  = [];

// ─── Shockwave rings pool (separate so we can animate them independently) ────
const activeShockwaves = [];

export function initObstacles(scene) {
  sceneRef = scene;
}

// ─────────────────────────────────────────────────────────────────────────────
// CRACK — jagged lightning-bolt lines, like the character is very heavy
// ─────────────────────────────────────────────────────────────────────────────
export function spawnCrater(x, z) {
  const points = [];
  const numRays = 7;

  for (let r = 0; r < numRays; r++) {
    const angle = (r / numRays) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const len   = 0.7 + Math.random() * 0.6;
    let cx = 0, cz = 0;

    // 3 zigzag steps per ray
    for (let s = 1; s <= 3; s++) {
      const frac   = s / 3;
      const jitter = (Math.random() - 0.5) * 0.35;
      const nx = Math.cos(angle + jitter) * len * frac;
      const nz = Math.sin(angle + jitter) * len * frac;
      points.push(cx, 0, cz,  nx, 0, nz);

      // One branch on second step
      if (s === 2 && Math.random() > 0.45) {
        const ba  = angle + (Math.random() - 0.5) * 1.2;
        const bl  = len * 0.38;
        points.push(cx, 0, cz,
                    cx + Math.cos(ba) * bl, 0,
                    cz + Math.sin(ba) * bl);
      }
      cx = nx; cz = nz;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
  const mat   = new THREE.LineBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0.9 });
  const lines = new THREE.LineSegments(geo, mat);
  lines.rotation.x = -Math.PI / 2;
  lines.position.set(x, 0.04, z);

  sceneRef.add(lines);
  activeCracks.push(lines);
}

// ─────────────────────────────────────────────────────────────────────────────
// METEOR IMPACT CRATER — bigger scorched disc + heavy cracks
// ─────────────────────────────────────────────────────────────────────────────
function spawnMeteorCrater(x, z) {
  // Scorched ground disc
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(2.0, 24),
    new THREE.MeshBasicMaterial({ color: 0x090606, transparent: true, opacity: 0.95 })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.set(x, 0.05, z);
  sceneRef.add(disc);
  activeCracks.push(disc);

  // Heavy cracks radiating out
  const points = [];
  const numRays = 12;
  for (let r = 0; r < numRays; r++) {
    const angle = (r / numRays) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
    const len   = 2.2 + Math.random() * 1.0;
    let cx = 0, cz = 0;
    for (let s = 1; s <= 4; s++) {
      const frac = s / 4;
      const j    = (Math.random() - 0.5) * 0.3;
      const nx   = Math.cos(angle + j) * len * frac;
      const nz   = Math.sin(angle + j) * len * frac;
      points.push(cx, 0, cz,  nx, 0, nz);
      if (s === 2 && Math.random() > 0.35) {
        const ba = angle + (Math.random() - 0.5) * 1.1;
        const bl = len * 0.4;
        points.push(cx, 0, cz,
                    cx + Math.cos(ba) * bl, 0,
                    cz + Math.sin(ba) * bl);
      }
      cx = nx; cz = nz;
    }
  }
  const crackGeo = new THREE.BufferGeometry();
  crackGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
  const crackLines = new THREE.LineSegments(
    crackGeo,
    new THREE.LineBasicMaterial({ color: 0x0a0805, transparent: true, opacity: 1.0 })
  );
  crackLines.rotation.x = -Math.PI / 2;
  crackLines.position.set(x, 0.06, z);
  sceneRef.add(crackLines);
  activeCracks.push(crackLines);

  // Expanding shockwave ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.05, 0.4, 28),
    new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.08, z);
  ring.userData = { age: 0, isShockwave: true };
  sceneRef.add(ring);
  activeShockwaves.push(ring);
}

// ─────────────────────────────────────────────────────────────────────────────
// SPAWN OBSTACLE
// ─────────────────────────────────────────────────────────────────────────────
export function spawnObstacle(zPos) {
  const laneIndex = Math.floor(Math.random() * 3);
  const xPos      = CONFIG.lanes[laneIndex];

  const isMeteorSpawn = Math.random() < 0.10;
  let type;
  if (isMeteorSpawn) type = 3;
  else type = Math.random() < 0.7 ? (Math.random() < 0.5 ? 0 : 1) : 2;

  let mesh;
  let isHole   = false;
  let isMeteor = false;

  if (type === 0 || type === 1) {
    // ── Normal blocks ──────────────────────────────────────────────────────
    const height = type === 0 ? 1.5 : 3;
    mesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, height, 2),
      new THREE.MeshStandardMaterial({ color: 0x550000 })
    );
    mesh.position.set(xPos, height / 2, zPos);

  } else if (type === 2) {
    // ── Hole ───────────────────────────────────────────────────────────────
    isHole = true;
    mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 3),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(xPos, 0.01, zPos);

  } else {
    // ── METEOR ─────────────────────────────────────────────────────────────
    isMeteor = true;

    // Low-poly rock: IcosahedronGeometry detail=1 is cheap (20 faces) but looks good
    // Scale to 2×2 footprint visually → radius 1.2
    mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.2, 1),   // detail=1: cheap, 80 faces
      new THREE.MeshStandardMaterial({
        color:       0x1c120c,
        roughness:   1.0,
        flatShading: true                       // Flat shading = no normal recalc, fast
      })
    );

    // Spawn just above visible area — close enough to arrive in ~0.5 sec
    mesh.position.set(xPos, 35, zPos - 15);

    // Pre-compute spin rates (random per meteor, cheap to apply)
    mesh.userData.spinX = 4 + Math.random() * 4;
    mesh.userData.spinZ = (Math.random() - 0.5) * 3;
    mesh.userData.fallVel = 18; // start speed (units/sec), accelerates
  }

  mesh.userData = {
    ...mesh.userData,
    isHole,
    isMeteor,
    passed:  false,
    landed:  false
  };
  sceneRef.add(mesh);
  activeObstacles.push(mesh);

  spawnCoinPattern(zPos, laneIndex);
}

function spawnCoinPattern(zPos, blockedLaneIndex) {
  const lanes = [0, 1, 2].filter(l => l !== blockedLaneIndex);
  if (!lanes.length) return;
  const xPos = CONFIG.lanes[lanes[Math.floor(Math.random() * lanes.length)]];

  for (let i = 0; i < 3; i++) {
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.2 })
    );
    coin.rotation.x = Math.PI / 2;
    coin.position.set(xPos, 1, zPos - (i * 2));
    coin.userData = { collected: false };
    sceneRef.add(coin);
    activeCoins.push(coin);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────
export function updateObstacles(playerGroup, deltaTime) {
  if (gameState.current !== STATE.PLAYING) return;

  const moveSpeed = gameState.speed * 60 * deltaTime;

  // ── Shockwave rings ───────────────────────────────────────────────────────
  for (let i = activeShockwaves.length - 1; i >= 0; i--) {
    const ring = activeShockwaves[i];
    ring.userData.age += deltaTime;
    const t = ring.userData.age;

    ring.scale.set(1 + t * 12, 1 + t * 12, 1);
    ring.material.opacity = Math.max(0, 0.9 - t * 2.8);
    ring.position.z += moveSpeed;

    if (ring.material.opacity <= 0) {
      sceneRef.remove(ring);
      ring.geometry.dispose();
      ring.material.dispose();
      activeShockwaves.splice(i, 1);
    }
  }

  // ── Cracks / craters ─────────────────────────────────────────────────────
  for (let i = activeCracks.length - 1; i >= 0; i--) {
    const obj = activeCracks[i];
    obj.position.z += moveSpeed;
    if (obj.position.z > 15) {
      sceneRef.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
      activeCracks.splice(i, 1);
    }
  }

  // ── Obstacles ─────────────────────────────────────────────────────────────
  for (let i = activeObstacles.length - 1; i >= 0; i--) {
    const obs = activeObstacles[i];
    obs.position.z += moveSpeed;

    if (obs.userData.isMeteor && !obs.userData.landed) {
      // Accelerate fall — feels heavy
      obs.userData.fallVel += 55 * deltaTime;
      obs.position.y -= obs.userData.fallVel * deltaTime;

      // Tumble
      obs.rotation.x += obs.userData.spinX * deltaTime;
      obs.rotation.z += obs.userData.spinZ * deltaTime;

      // Land at y = radius (1.2)
      if (obs.position.y <= 1.2) {
        obs.position.y     = 1.2;
        obs.userData.landed = true;
        spawnMeteorCrater(obs.position.x, obs.position.z);

        // Tiny settle bounce — no extra objects, just nudge position
        obs.userData.bounceTimer = 0.12;
        obs.userData.originX = obs.position.x;
      }
    }

    // Short settle shake after landing (no new objects, zero cost)
    if (obs.userData.isMeteor && obs.userData.landed && obs.userData.bounceTimer > 0) {
      obs.userData.bounceTimer -= deltaTime;
      obs.position.x = obs.userData.originX + (Math.random() - 0.5) * 0.18;
      if (obs.userData.bounceTimer <= 0) obs.position.x = obs.userData.originX;
    }

    // ── Collision ──────────────────────────────────────────────────────────
    const zDist = Math.abs(obs.position.z - playerGroup.position.z);
    if (zDist < 1.5) {
      const xDist = Math.abs(obs.position.x - playerGroup.position.x);
      if (xDist < 1.0) {
        if (obs.userData.isHole) {
          if (playerGroup.position.y < 0.5) triggerDeath();

        } else if (obs.userData.isMeteor) {
          // Meteor radius 1.2 — player feet must be > 0.2 to "clear" it
          // We allow passing if still falling (not landed yet) since it's above
          if (obs.userData.landed && playerGroup.position.y < 0.3) triggerDeath();

        } else {
          // Normal blocks: feet (y=0) + small hitbox margin
          // Small block height=1.5: player clears if feet > 1.1
          const blockHeight = obs.geometry.parameters.height;
          if (playerGroup.position.y < blockHeight - 0.4) triggerDeath();
        }
      }
    }

    if (obs.position.z > playerGroup.position.z + 2 && !obs.userData.passed) {
      obs.userData.passed = true;
      gameState.score += 10;
    }

    if (obs.position.z > 15) {
      sceneRef.remove(obs);
      if (obs.geometry) obs.geometry.dispose();
      if (obs.material) obs.material.dispose();
      activeObstacles.splice(i, 1);
    }
  }

  // ── Coins ─────────────────────────────────────────────────────────────────
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

  // ── Spawn timer ───────────────────────────────────────────────────────────
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
  for (const obs of activeObstacles) {
    sceneRef.remove(obs);
    if (obs.geometry) obs.geometry.dispose();
    if (obs.material) obs.material.dispose();
  }
  activeObstacles.length = 0;

  for (const coin of activeCoins) {
    sceneRef.remove(coin);
    coin.geometry.dispose();
    coin.material.dispose();
  }
  activeCoins.length = 0;

  for (const obj of activeCracks) {
    sceneRef.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  }
  activeCracks.length = 0;

  for (const ring of activeShockwaves) {
    sceneRef.remove(ring);
    ring.geometry.dispose();
    ring.material.dispose();
  }
  activeShockwaves.length = 0;
}
