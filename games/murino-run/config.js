export const ASSETS = {
  models: {
    run: './assets/run.glb',
    jump: './assets/jump.glb',
    fall: './assets/fall.glb',
    dance1: './assets/dance1.glb',
    dance2: './assets/dance2.glb'
  },
  textures: {
    fog: './assets/fog.png',
    roads: ['./assets/road1.png', './assets/road2.png', './assets/road3.png'],
    buildings: ['./assets/building4.png', './assets/building5.png']
  },
  video: './assets/mel.webm'
};

export const CONFIG = {
  lanes: [-3, 0, 3],

  // Jump physics
  // Peak is now around ~1.35m instead of crazy high
  gravity: -24,
  jumpPower: 8.1,

  // Game speed
  initialSpeed: 0.3,
  speedMultiplier: 0.0001,

  // World
  roadWidth: 12,
  roadLen: 120,
  roadCount: 6,

  // Player
  playerYOffset: 0,
  modelHeight: 4.5,

  // Collision tuning
  // Small block can now be cleared easier
  smallBlockClearHeight: 0.95,

  // Visual model offsets
  normalModelOffsetY: 0,
  jumpModelOffsetY: 0,
  // fall.glb was sinking into sidewalk, so lift it more
  fallModelOffsetY: 0.55,

  // Face video plane
  faceVideoWidth: 1.05,
  faceVideoHeight: 1.2,
  faceVideoOffsetX: 0,
  faceVideoOffsetY: 3.2,
  faceVideoOffsetZ: 0.62
};

export const STATE = {
  LOADING: 'LOADING',
  INTRO: 'INTRO',
  TRANSITION: 'TRANSITION',
  PLAYING: 'PLAYING',
  DYING: 'DYING'
};
