const THREE = window.THREE;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function makeGround(scene) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(260, 260),
    new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 1,
      metalness: 0
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.06;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function makeRoadSegment(config, tex) {
  const segment = new THREE.Group();

  const roadGeo = new THREE.PlaneGeometry(config.road.width, config.road.length, 1, 16);
  const pos = roadGeo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getY(i);
    const wobble =
      Math.sin(z * 0.42) * 0.02 +
      Math.cos(x * 1.5) * 0.015;
    pos.setZ(i, wobble);
  }
  roadGeo.computeVertexNormals();

  const roadMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 1,
    metalness: 0.02
  });

  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.receiveShadow = true;
  segment.add(road);

  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0x191919,
    roughness: 1
  });

  const sidewalkGeo = new THREE.BoxGeometry(1.2, 0.22, config.road.length);

  const leftWalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
  leftWalk.position.set(-config.road.width / 2 - 0.85, 0.05, 0);
  leftWalk.castShadow = true;
  leftWalk.receiveShadow = true;

  const rightWalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
  rightWalk.position.set(config.road.width / 2 + 0.85, 0.05, 0);
  rightWalk.castShadow = true;
  rightWalk.receiveShadow = true;

  segment.add(leftWalk, rightWalk);

  const curbGeo = new THREE.BoxGeometry(0.18, 0.16, config.road.length);
  const curbMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 1
  });

  const leftCurb = new THREE.Mesh(curbGeo, curbMat);
  leftCurb.position.set(-config.road.width / 2 - 0.18, 0.12, 0);
  leftCurb.castShadow = true;
  leftCurb.receiveShadow = true;

  const rightCurb = new THREE.Mesh(curbGeo, curbMat);
  rightCurb.position.set(config.road.width / 2 + 0.18, 0.12, 0);
  rightCurb.castShadow = true;
  rightCurb.receiveShadow = true;

  segment.add(leftCurb, rightCurb);

  const lineMat = new THREE.MeshBasicMaterial({
    color: 0xc8c8c8,
    transparent: true,
    opacity: 0.75
  });

  const dashGeo = new THREE.PlaneGeometry(0.12, 1.9);

  for (let i = 0; i < 4; i++) {
    const dash1 = new THREE.Mesh(dashGeo, lineMat);
    dash1.rotation.x = -Math.PI / 2;
    dash1.position.set(-config.road.width / 6, 0.011, -7 + i * 5.2);

    const dash2 = new THREE.Mesh(dashGeo, lineMat);
    dash2.rotation.x = -Math.PI / 2;
    dash2.position.set(config.road.width / 6, 0.011, -7 + i * 5.2);

    segment.add(dash1, dash2);
  }

  return segment;
}

function makeFacadeCard(tex) {
  const group = new THREE.Group();

  const height = rand(8, 15);
  const width = rand(5.5, 8.5);
  const depth = rand(3.2, 5.5);

  const core = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      color: 0x181818,
      roughness: 1
    })
  );
  core.castShadow = true;
  core.receiveShadow = true;
  group.add(core);

  const facade = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.95, height * 0.95),
    new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 1,
      metalness: 0,
      side: THREE.DoubleSide
    })
  );
  facade.position.z = depth / 2 + 0.02;
  group.add(facade);

  return { group, width, height, depth };
}

function makeLamp() {
  const group = new THREE.Group();

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 4.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x4b4f57, roughness: 1 })
  );
  pole.position.y = 2.3;
  pole.castShadow = true;

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.05, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x545a63, roughness: 1 })
  );
  arm.position.set(0.35, 4.35, 0);
  arm.castShadow = true;

  const bulb = new THREE.PointLight(0xe4ecff, 0.8, 8, 2);
  bulb.position.set(0.68, 4.25, 0);

  const bulbMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xdfe9ff })
  );
  bulbMesh.position.copy(bulb.position);

  group.add(pole, arm, bulb, bulbMesh);
  return group;
}

function createObstacleSingle() {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 1.45, 1.35),
    new THREE.MeshStandardMaterial({ color: 0x4b4b4b, roughness: 0.96 })
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.kind = 'single';
  return mesh;
}

function createObstacleDouble() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.96 });

  const a = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.35, 1.2), mat);
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.35, 1.2), mat);

  a.position.x = -0.78;
  b.position.x = 0.78;
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

  const laneWidth = config.road.width / 3;

  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(laneWidth - 0.32, 0.05, 2.4),
    new THREE.MeshStandardMaterial({
      color: 0x030303,
      roughness: 1
    })
  );
  plate.position.y = -0.03;

  const dark = new THREE.Mesh(
    new THREE.PlaneGeometry(laneWidth - 0.2, 2.2),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide
    })
  );
  dark.rotation.x = -Math.PI / 2;
  dark.position.y = 0.01;

  group.add(plate, dark);
  group.userData.kind = 'hole';
  return group;
}

function createObstacleFalling() {
  const group = new THREE.Group();

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 2.6, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x343434, roughness: 0.98 })
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

    for (let row = 0; row < config.city.buildingRows; row++) {
      const z = zBase + row * (config.city.chunkLength / config.city.buildingRows);

      for (const side of [-1, 1]) {
        const localCount = 2 + Math.floor(Math.random() * 2);

        for (let i = 0; i < localCount; i++) {
          const facadeData = makeFacadeCard(
            assets.textures.buildings[(c + row + i + (side > 0 ? 1 : 0)) % assets.textures.buildings.length]
          );

          const xBase = side * config.city.sideOffset;
          const x = xBase + side * rand(-0.6, 1.8);

          facadeData.group.position.set(
            x,
            facadeData.height / 2,
            z + rand(-3.5, 3.5)
          );

          facadeData.group.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
          chunk.add(facadeData.group);
        }
      }
    }

    for (let i = 0; i < config.city.lampsPerChunk; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const lamp = makeLamp();
      lamp.position.set(
        side * (config.road.width / 2 + 1.55),
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
  for (let i = 0; i < 7; i++) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8 + i * 0.5, 3.2 + i * 0.34),
      new THREE.MeshBasicMaterial({
        map: assets.textures.fog,
        transparent: true,
        depthWrite: false,
        opacity: 0.16 + i * 0.055,
        color: new THREE.Color().setHSL(0.62, 0.15, 0.34 + i * 0.03)
      })
    );
    plane.position.set(rand(-0.7, 0.7), 1.6 + rand(0, 1), -i * 0.28);
    fogMonster.add(plane);
  }
  fogMonster.visible = false;
  scene.add(fogMonster);

  let nextObstacleZ = 24;

  function spawnObstacle() {
    const laneIndex = Math.floor(Math.random() * config.lanes.length);
    const x = config.lanes[laneIndex];
    const r = Math.random();

    let obs;

    if (r < config.obstacles.holeChance) {
      obs = createObstacleHole(config);
      obs.position.y = 0;
    } else if (r < config.obstacles.holeChance + config.obstacles.doubleChance) {
      obs = createObstacleDouble();
      obs.position.y = 0.72;
    } else if (r < config.obstacles.holeChance + config.obstacles.doubleChance + config.obstacles.fallingChance) {
      obs = createObstacleFalling();
      obs.position.y = 5.6;
    } else {
      obs = createObstacleSingle();
      obs.position.y = 0.78;
    }

    obs.position.x = x;
    obs.position.z = nextObstacleZ;
    scene.add(obs);
    obstacles.push(obs);

    nextObstacleZ += rand(config.obstacles.minGap, config.obstacles.maxGap);
  }

  function ensureObstacleDensity(distance) {
    while (nextObstacleZ < distance + config.obstacles.lookAhead) {
      spawnObstacle();
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
        if (obs.position.z - distance < 14) {
          obs.userData.dropProgress += dt * 2.8;
          const t = Math.min(obs.userData.dropProgress, 1);
          obs.position.y = THREE.MathUtils.lerp(5.6, 1.2, t);
          obs.rotation.z += dt * 1.6;
        } else {
          obs.rotation.z += dt * 0.25;
        }
      }

      if (obs.position.z < distance - config.obstacles.cleanupBehind) {
        scene.remove(obs);
        obstacles.splice(i, 1);
      }
    }
  }

  function getObstacleHit(playerBounds, playerX, isJumping, playerZ = 0) {
    for (const obs of obstacles) {
      if (obs.userData.kind === 'hole') {
        const laneWidth = config.road.width / 3;
        const sameLane = Math.abs(obs.position.x - playerX) < laneWidth * 0.23;
        const nearZ = Math.abs(obs.position.z - playerZ) < 1.35;

        if (sameLane && nearZ && !isJumping) {
          return obs;
        }
        continue;
      }

      obstacleBox.setFromObject(obs);
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
      1.6,
      playerPos.z - configRef.fogMonster.startBehind
    );
  }

  function updateDeathFog(dt, playerPos, elapsed, configRef = config) {
    fogMonster.position.x = THREE.MathUtils.lerp(fogMonster.position.x, playerPos.x, 0.09);
    fogMonster.position.z += dt * configRef.fogMonster.deathApproachSpeed;

    fogMonster.children.forEach((plane, index) => {
      plane.rotation.z += dt * (0.15 + index * 0.06);
      plane.position.x = Math.sin(elapsed * (1.5 + index * 0.32)) * (0.1 + index * 0.06);
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
