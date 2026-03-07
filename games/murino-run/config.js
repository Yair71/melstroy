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

  lanes: [-3.2, 0, 3.2],

  gameplay: {
    startSpeed: 15,
    maxSpeed: 30,
    accelPerSecond: 0.2,
    scoreFactor: 2.1
  },

  player: {
    startLane: 1,
    y: 0,
    scale: 1.55,
    laneLerp: 12,
    gravity: 42,
    jumpVelocity: 14.5,
    collisionShrinkX: 0.18,
    collisionShrinkY: 0.12,
    collisionShrinkZ: 0.12
  },

  road: {
    width: 10,
    length: 44,
    count: 8
  },

  city: {
    chunkLength: 72,
    chunkCount: 6,
    sideOffset: 15,
    lampsPerChunk: 3,
    buildingRows: 4
  },

  obstacles: {
    minGap: 17,
    maxGap: 28,
    lookAhead: 170,
    cleanupBehind: 20,
    holeChance: 0.20,
    doubleChance: 0.22,
    fallingChance: 0.16
  },

  camera: {
    introPos: { x: 0, y: 2.8, z: 8.2 },
    gameplayOffset: { x: 0, y: 5.2, z: -8.5 },
    gameplayLookAhead: { x: 0, y: 2.1, z: 11 },
    deathDuration: 3.0
  },

  fogMonster: {
    startBehind: 14,
    deathApproachSpeed: 6.4
  },

  ui: {
    title: 'MURINO RUN',
    subtitle: 'Run from Fog through broken Murino.'
  }
};
