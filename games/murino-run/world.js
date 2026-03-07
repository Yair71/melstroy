const THREE = window.THREE;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function makeGround(scene) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(260, 260),
    new THREE.MeshStandardMaterial({
      color: 0x0b0b0b,
      roughness: 1,
      metalness: 0
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.03;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function makeRoadSegment(config, tex) {
  const geo = new THREE.PlaneGeometry(config.road.width, config.road.length, 1, 10);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getY(i);
    const wobble = Math.sin(z * 0.45) * 0.035 + Math.cos(x * 0.6) * 0.025;
    pos.setZ(i, wobble);
  }

  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 1,
    metalness: 0.02
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;

  const curbGeo = new THREE.BoxGeometry(0.25, 0.18, config.road.length);
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 });

  const left = new THREE.Mesh(curbGeo, curbMat);
  const right = new THREE.Mesh(curbGeo, curbMat);
  left.position.set(-config.road.width / 2 - 0.15, 0.08, 0);
  right.position.set(config.road.width / 2 + 0.15, 0.08, 0);
  left.castShadow = true;
  right.castShadow = true;

  mesh.add(left, right);
  return mesh;
}

function makeBuilding(tex) {
  const w = rand(3, 7);
  const h = rand(8, 26);
  const d = rand(4, 10);

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.96,
      metalness: 0.03
    })
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeLamp() {
  const group = new THREE.Group();

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 5.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x282828, roughness: 1 })
  );
  pole.position.y = 2.8;
  pole.castShadow = true;

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.08, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x262626, roughness: 1 })
  );
  arm.position.set(0.42, 5.15, 0);
  arm.castShadow = true;

  const light = new THREE.PointLight(0xd6e3ff, 0.8, 10, 2);
  light.position.set(0.86, 5.05, 0);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xcddfff })
  );
  bulb.position.copy(light.position);

  group.add(pole, arm, light, bulb);
  return group;
}

function createObstacleSingle() {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 2.2, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x464646, roughness: 0.96 })
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.kind = 'single';
  return mesh;
}

function createObstacleDouble() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x4f4f4f, roughness: 0.96 });

  const a = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.1, 2.0), mat);
  const b = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.1, 2.0), mat);

  a.position.x = -1.15;
  b.position.x = 1.15;
  a.castShadow = true;
  b.castShadow = true;
  a.receiveShadow = true;
  b.receiveShadow = true;

  group.add(a, b);
  group.userData.kind = 'double';
  return group;
}

function createObstacleHole(config) {
  const group = new THREE.Group();

  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(config.road.width / 3 - 0.5, 0.06, 3.8),
    new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 })
  );

  const dark = new THREE.Mesh(
    new THREE.PlaneGeometry(config.road.width / 3 - 0.7, 3.5),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    })
  );

  plate.position.y = -0.03;
  dark.rotation.x = -Math.PI / 2;
  dark.position.y = 0.01;

  group.add(plate, dark);
  group.userData.kind = 'hole';
  return group;
}

function createObstacleFalling() {
  const group = new THREE.Group();

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 3.6, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.98 })
  );

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  group.add(mesh);
  group.userData.kind = 'falling';
  group.userData.dropProgress = 0;
  return group;
}

export function createWorld(scene, assets, config) {
  const roadSegments = [];
  const cityChunks = [];
  const obstacles = [];
  const obstacleBox = new THREE.Box3();

  makeGround(scene);

  for (let i = 0; i < config.road.count; i++) {
    const tex = assets.textures.roads[i % assets.textures.roads.length];
    const seg = makeRoadSegment(config, tex);
    seg.position.z = i * config.road.length;
    scene.add(seg);
    roadSegments.push(seg);
  }

  for (let c = 0; c < config.city.chunkCount; c++) {
    const chunk = new THREE.Group();
    const zBase = c * config.city.chunkLength;
    chunk.userData.baseZ = zBase;

    for (let r = 0; r < config.city.buildingRows; r++) {
      const z = zBase + r * (config.city.chunkLength / config.city.buildingRows);

      for (const side of [-1, 1]) {
        const xBase = side * config.city.sideOffset;
        const count = 2 + Math.floor(Math.random() * 2);

        for (let i = 0; i < count; i++) {
          const building = makeBuilding(
            assets.textures.buildings[(c + i + (side > 0 ? 1 : 0)) % assets.textures.buildings.length]
          );
          building.position.set(
            xBase + side * rand(0, 8),
            building.geometry.parameters.height / 2,
            z + rand(-4.5, 4.5)
          );
          building.rotation.y = rand(-0.09, 0.09);
          chunk.add(building);
        }
      }
    }

    for (let i = 0; i < config.city.lampsPerChunk; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const lamp = makeLamp();
      lamp.position.set(
        side * (config.road.width / 2 + 2.2),
        0,
        zBase + rand(0, config.city.chunkLength)
      );
      lamp.rotation.y = side < 0 ? Math.PI : 0;
      chunk.add(lamp);
    }

    scene.add(chunk);
    cityChunks.push(chunk);
  }

  const fogMonster = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(5 + i * 0.6, 4.2 + i * 0.4),
      new THREE.MeshBasicMaterial({
        map: assets.textures.fog,
        transparent: true,
        depthWrite: false,
        opacity: 0.14 + i * 0.06,
        color: new THREE.Color().setHSL(0.62, 0.18, 0.35 + i * 0.03)
      })
    );
    plane.position.set(rand(-0.8, 0.8), 1.8 + rand(0, 1.2), -i * 0.35);
    fogMonster.add(plane);
  }
  fogMonster.visible = false;
  scene.add(fogMonster);

  let nextObstacleZ = 28;

  function spawnObstacle(distance) {
    const laneIndex = Math.floor(Math.random() * config.lanes.length);
    const x = config.lanes[laneIndex];

    const r = Math.random();
    let obs;

    if (r < config.obstacles.holeChance) {
      obs = createObstacleHole(config);
      obs.position.y = 0;
    } else if (r < config.obstacles.holeChance + config.obstacles.doubleChance) {
      obs = createObstacleDouble();
      obs.position.y = 1.05;
    } else if (r < config.obstacles.holeChance + config.obstacles.doubleChance + config.obstacles.fallingChance) {
      obs = createObstacleFalling();
      obs.position.y = 7.5;
    } else {
      obs = createObstacleSingle();
      obs.position.y = 1.1;
    }

    obs.position.x = x;
    obs.position.z = nextObstacleZ;
    scene.add(obs);
    obstacles.push(obs);

    nextObstacleZ += rand(config.obstacles.minGap, config.obstacles.maxGap);
  }

  function ensureObstacleDensity(distance) {
    while (nextObstacleZ < distance + config.obstacles.lookAhead) {
      spawnObstacle(distance);
    }
  }

  function update(distance, dt) {
    let maxRoadZ = -Infinity;
    for (const seg of roadSegments) {
      if (seg.position.z > maxRoadZ) maxRoadZ = seg.position.z;
    }

    const roadThreshold = distance - config.road.length;
    for (const seg of roadSegments) {
      if (seg.position.z < roadThreshold) {
        seg.position.z = maxRoadZ + config.road.length;
        maxRoadZ = seg.position.z;

        seg.material.map = assets.textures.roads[
          Math.floor(Math.random() * assets.textures.roads.length)
        ];
        seg.material.needsUpdate = true;
      }
    }

    let maxChunkWorldZ = -Infinity;
    for (const chunk of cityChunks) {
      const currentWorldZ = (chunk.position.z || 0) + chunk.userData.baseZ;
      if (currentWorldZ > maxChunkWorldZ) maxChunkWorldZ = currentWorldZ;
    }

    const chunkThreshold = distance - config.city.chunkLength;
    for (const chunk of cityChunks) {
      const currentWorldZ = (chunk.position.z || 0) + chunk.userData.baseZ;
      if (currentWorldZ < chunkThreshold) {
        const nextWorldZ = maxChunkWorldZ + config.city.chunkLength;
        chunk.position.z = nextWorldZ - chunk.userData.baseZ;
        maxChunkWorldZ = nextWorldZ;
      }
    }

    ensureObstacleDensity(distance);

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];

      if (obs.userData.kind === 'falling') {
        if (obs.position.z - distance < 18) {
          obs.userData.dropProgress += dt * 2.5;
          const t = Math.min(obs.userData.dropProgress, 1);
          obs.position.y = THREE.MathUtils.lerp(7.5, 1.8, t);
          obs.rotation.z += dt * 1.2;
        } else {
          obs.rotation.z += dt * 0.35;
        }
      }

      if (obs.position.z < distance - config.obstacles.cleanupBehind) {
        scene.remove(obs);
        obstacles.splice(i, 1);
      }
    }
  }

  function getObstacleHit(playerBounds, playerX, isJumping) {
    for (const obs of obstacles) {
      if (obs.userData.kind === 'hole') {
        const laneWidth = config.road.width / 3;
        const sameLane = Math.abs(obs.position.x - playerX) < laneWidth * 0.24;
        const nearZ = Math.abs(obs.position.z) < 1.7;

        if (sameLane && nearZ && !isJumping) {
          return obs;
        }
        continue;
      }

      obstacleBox.setFromObject(obs);
      obstacleBox.min.z -= 0.3;
      obstacleBox.max.z += 0.3;

      if (playerBounds.intersectsBox(obstacleBox)) {
        return obs;
      }
    }

    return null;
  }

  function beginDeathFog(playerPos, configRef = config) {
    fogMonster.visible = true;
    fogMonster.position.set(
      playerPos.x,
      1.8,
      playerPos.z - configRef.fogMonster.startBehind
    );
  }

  function updateDeathFog(dt, playerPos, elapsed, configRef = config) {
    fogMonster.position.x = THREE.MathUtils.lerp(fogMonster.position.x, playerPos.x, 0.08);
    fogMonster.position.z += dt * configRef.fogMonster.deathApproachSpeed;

    fogMonster.children.forEach((plane, index) => {
      plane.rotation.z += dt * (0.2 + index * 0.06);
      plane.position.x = Math.sin(elapsed * (1.8 + index * 0.35)) * (0.16 + index * 0.06);
    });
  }

  function dispose() {
    for (const obs of obstacles) scene.remove(obs);
    for (const seg of roadSegments) scene.remove(seg);
    for (const chunk of cityChunks) scene.remove(chunk);
    scene.remove(fogMonster);
  }

  return {
    obstacles,
    fogMonster,
    update,
    getObstacleHit,
    beginDeathFog,
    updateDeathFog,
    dispose
  };
}
