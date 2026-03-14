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



export function spawnCrater(x, z) {
  const crackGroup = new THREE.Group();
  crackGroup.position.set(x, 0.04, z);

  const numRays = 8 + Math.floor(Math.random() * 5); // 8–12 rays
  const points = [];

  for (let r = 0; r < numRays; r++) {
    const baseAngle = (r / numRays) * Math.PI * 2;
    const angle = baseAngle + (Math.random() - 0.5) * 0.4;

 
    const segments = 3 + Math.floor(Math.random() * 2);
    let cx = 0, cz = 0;
    const maxLen = 1.0 + Math.random() * 0.8; 

    for (let s = 0; s < segments; s++) {
      const frac = (s + 1) / segments;
      const jitter = (Math.random() - 0.5) * 0.25;
      const nx = Math.cos(angle + jitter) * maxLen * frac;
      const nz = Math.sin(angle + jitter) * maxLen * frac;

      points.push(cx, 0, cz);
      points.push(nx, 0, nz);

 
      if (s === 1 && Math.random() > 0.5) {
        const branchAngle = angle + (Math.random() - 0.5) * 0.9;
        const branchLen = maxLen * 0.35;
        points.push(cx, 0, cz);
        points.push(cx + Math.cos(branchAngle) * branchLen, 0, cz + Math.sin(branchAngle) * branchLen);
      }

      cx = nx;
      cz = nz;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));

  const mat = new THREE.LineBasicMaterial({
    color: 0x111111,
    linewidth: 2,
    transparent: true,
    opacity: 0.95
  });

  const lines = new THREE.LineSegments(geo, mat);
  lines.rotation.x = -Math.PI / 2;
  crackGroup.add(lines);


  const burnGeo = new THREE.CircleGeometry(0.22, 12);
  const burnMat = new THREE.MeshBasicMaterial({ color: 0x050505, transparent: true, opacity: 0.9 });
  const burn = new THREE.Mesh(burnGeo, burnMat);
  burn.rotation.x = -Math.PI / 2;
  crackGroup.add(burn);

  sceneRef.add(crackGroup);
  activeCracks.push(crackGroup);
}


function spawnMeteorCrater(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0.05, z);

 
  const discGeo = new THREE.CircleGeometry(2.2, 32);
  const discMat = new THREE.MeshBasicMaterial({ color: 0x080808, transparent: true, opacity: 0.92 });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = -Math.PI / 2;
  group.add(disc);

  
  const numRays = 14;
  const points = [];
  for (let r = 0; r < numRays; r++) {
    const angle = (r / numRays) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
    const len = 2.0 + Math.random() * 1.2;
    let cx = 0, cz = 0;
    const segs = 4;
    for (let s = 0; s < segs; s++) {
      const frac = (s + 1) / segs;
      const j = (Math.random() - 0.5) * 0.3;
      const nx = Math.cos(angle + j) * len * frac;
      const nz = Math.sin(angle + j) * len * frac;
      points.push(cx, 0, cz, nx, 0, nz);
      if (s === 1 && Math.random() > 0.4) {
        const ba = angle + (Math.random() - 0.5) * 1.0;
        const bl = len * 0.4;
        points.push(cx, 0, cz, cx + Math.cos(ba) * bl, 0, cz + Math.sin(ba) * bl);
      }
      cx = nx; cz = nz;
    }
  }
  const crackGeo = new THREE.BufferGeometry();
  crackGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
  const crackMat = new THREE.LineBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: 1.0 });
  const cracks = new THREE.LineSegments(crackGeo, crackMat);
  cracks.rotation.x = -Math.PI / 2;
  group.add(cracks);

  sceneRef.add(group);
  activeCracks.push(group);

 
  spawnShockwave(x, z);
}

function spawnShockwave(x, z) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 0.5, 32),
    new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.06, z);
  ring.userData = { isShockwave: true, age: 0 };
  sceneRef.add(ring);
  activeCracks.push(ring); 
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

  
    const geo = new THREE.IcosahedronGeometry(2.0, 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a0f0a,
      roughness: 1.0,
      metalness: 0.0,
      flatShading: true
    });
    mesh = new THREE.Mesh(geo, mat);

  
    mesh.position.set(xPos, 120, zPos - 30);

  
    mesh.userData.spinX = (Math.random() - 0.5) * 8;
    mesh.userData.spinZ = (Math.random() - 0.5) * 4;

  
    const meteorLight = new THREE.PointLight(0xff4400, 3, 20);
    mesh.add(meteorLight);
  }

  mesh.userData = { ...mesh.userData, isHole, isMeteor, passed: false, landed: false };
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


  for (let i = activeCracks.length - 1; i >= 0; i--) {
    const obj = activeCracks[i];

    if (obj.userData.isShockwave) {
      obj.userData.age += deltaTime;
      const t = obj.userData.age;
      const scale = 1 + t * 9;         
      obj.scale.set(scale, scale, scale);
      obj.material.opacity = Math.max(0, 0.85 - t * 2.5);
      if (obj.material.opacity <= 0) {
        sceneRef.remove(obj);
        obj.geometry.dispose();
        obj.material.dispose();
        activeCracks.splice(i, 1);
        continue;
      }
    }

    obj.position.z += moveSpeed;
    if (obj.position.z > 15) {
      sceneRef.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();

      obj.traverse && obj.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      activeCracks.splice(i, 1);
    }
  }

  for (let i = activeObstacles.length - 1; i >= 0; i--) {
    const obs = activeObstacles[i];
    obs.position.z += moveSpeed;

    if (obs.userData.isMeteor) {
      if (!obs.userData.landed) {
        if (!obs.userData.fallVelocity) obs.userData.fallVelocity = 5;
        obs.userData.fallVelocity += 80 * deltaTime; // acceleration

        obs.position.y -= obs.userData.fallVelocity * deltaTime;

        obs.rotation.x += (obs.userData.spinX || 5) * deltaTime;
        obs.rotation.z += (obs.userData.spinZ || 2) * deltaTime;

        if (obs.position.y <= 2.0) {
          obs.position.y = 2.0;
          obs.userData.landed = true;

          obs.children.forEach(child => {
            if (child.isLight) obs.remove(child);
          });

          spawnMeteorCrater(obs.position.x, obs.position.z);

          obs.userData.shakeTimer = 0.18;
          obs.userData.shakeOriginX = obs.position.x;
        }
      } else {
        if (obs.userData.shakeTimer > 0) {
          obs.userData.shakeTimer -= deltaTime;
          obs.position.x = obs.userData.shakeOriginX + (Math.random() - 0.5) * 0.3;
        } else {
          obs.position.x = obs.userData.shakeOriginX || obs.position.x;
        }
      }
    }

    const zDistance = Math.abs(obs.position.z - playerGroup.position.z);
    if (zDistance < 1.5) {
      const xDistance = Math.abs(obs.position.x - playerGroup.position.x);
      if (xDistance < 1.0) {
        if (obs.userData.isHole) {
          if (playerGroup.position.y < 0.5) triggerDeath();
        } else if (obs.userData.isMeteor) {
          if (playerGroup.position.y < 2.2) triggerDeath();
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
      obs.geometry && obs.geometry.dispose();
      obs.material && obs.material.dispose();
      activeObstacles.splice(i, 1);
    }
  }

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
    obs.geometry && obs.geometry.dispose();
    obs.material && obs.material.dispose();
  }
  activeObstacles.length = 0;

  for (let coin of activeCoins) {
    sceneRef.remove(coin);
    coin.geometry.dispose();
    coin.material.dispose();
  }
  activeCoins.length = 0;

  for (let obj of activeCracks) {
    sceneRef.remove(obj);
    obj.traverse && obj.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  }
  activeCracks.length = 0;
}
