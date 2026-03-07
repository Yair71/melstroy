export const MURINO_CONFIG = {
  assets: {
    model: './assets/mel.glb',
    run: './assets/running.glb',
    jump: './assets/jump.glb',
    fall: './assets/fall.glb',
    dance1: './assets/dance.glb',
    dance2: './assets/dance2.glb',
    fog: './assets/fog.png',
    roads: [
      './assets/road1.png',
      './assets/road2.png',
      './assets/road3.png'
    ],
    buildings: [
      './assets/building4.png',
      './assets/building5.png'
    ],
    video: './assets/mel.webm'
  },

  lanes: [-1.9, 0, 1.9],

  gameplay: {
    startSpeed: 18,
    maxSpeed: 34,
    accelPerSecond: 0.45,
    scoreFactor: 2.4
  },

  player: {
    startLane: 1,
    y: 0,
    scale: 2.55,
    laneLerp: 18,
    gravity: 44,
    jumpVelocity: 15.2,
    collisionShrinkX: 0.12,
    collisionShrinkY: 0.10,
    collisionShrinkZ: 0.10
  },

  road: {
    width: 7.2,
    length: 22,
    count: 12
  },

  city: {
    chunkLength: 52,
    chunkCount: 8,
    sideOffset: 8.5,
    lampsPerChunk: 4,
    buildingRows: 4
  },

  obstacles: {
    minGap: 12,
    maxGap: 21,
    lookAhead: 125,
    cleanupBehind: 18,
    holeChance: 0.18,
    doubleChance: 0.22,
    fallingChance: 0.14
  },

  camera: {
    introPos: { x: 0, y: 2.35, z: 5.4 },
    gameplayOffset: { x: 0, y: 3.4, z: -5.7 },
    gameplayLookAhead: { x: 0, y: 1.25, z: 8.5 },
    deathDuration: 3.0
  },

  fogMonster: {
    startBehind: 10,
    deathApproachSpeed: 7.4
  },

  ui: {
    title: 'MURINO RUN',
    subtitle: 'Run from Fog through broken Murino.'
  }
};
